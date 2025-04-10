import {Dir, DirIterator, File, Node, NodeType} from "./node.ts";
import {KVStore} from "../p2pStore/kvStore.ts";
import {appendBytes, arrayBufferToString, stringToArrayBuffer} from "../utils/globelTools.ts";
// 常量定义
const LIST_LIMIT = 2048;
const BLOCK_LIMIT = 256 * 1024; // 256KB

let myMap = new Map<FsObject, ArrayBuffer>();

const ObjectType = {
    BLOB: 'blob',
    LIST: 'list',
    TREE: 'tree',
} as const;

// 类型定义
type ObjectType = typeof ObjectType[keyof typeof ObjectType];

interface Link {
    name: string;
    hash: ArrayBuffer;
    size: number;
}

interface FsObject {
    links: Link[];
    data: ArrayBuffer;
}


// 工具函数
function panic(message: string): never {
    throw new Error(message);
}

export class FsObjectHelper {
    static async add(store: KVStore, node: Node): Promise<ArrayBuffer|undefined> {
        switch (node.type()) {
            case NodeType.FILE:
                const fileRoot = await this.sliceFile(<File>node, store);
                return this.getKey(fileRoot);
            case NodeType.DIR:
                const dirRoot = await this.sliceDir(<Dir>node, store);
                return this.getKey(dirRoot);
            default:
                return panic('Unsupported node type');
        }
    }
    private static getKey(obj: FsObject): ArrayBuffer | undefined {
        return myMap.get(obj);
    }
    static appendActionAsTree(obj: FsObject, hash: ArrayBuffer, size: number, name: string, type: ObjectType) {
        obj.links.push({
            name,
            hash,
            size,
        });
        const typeBuffer = stringToArrayBuffer(type);
        obj.data = appendBytes(obj.data, typeBuffer)
    }

    static appendActionAsList(obj: FsObject, hash: ArrayBuffer, size: number, type: ObjectType) {
        this.appendActionAsTree(obj, hash, size, '', type);
    }

    private static getValue(obj: FsObject): ArrayBuffer {
        const jsonStr = JSON.stringify({
            links: obj.links.map(link => ({
                ...link,
                hash: arrayBufferToString(link.hash)
            })),
            data: obj.data
        });

        return  stringToArrayBuffer(jsonStr)
    }

    private static async put(store: KVStore, value: ArrayBuffer, objType: ObjectType) : Promise<ArrayBuffer|undefined> {
        if (objType !== ObjectType.TREE && value.byteLength > BLOCK_LIMIT) {
            panic('Block over the limit');
        }
        return await store.put(value);
    }

    private static async saveObject(obj: FsObject, store: KVStore, objType: ObjectType) {
        const  value = this.getValue(obj);
        const key = await this.put(store, value, objType);
        myMap.set(obj, <ArrayBuffer>key);
    }

    private static async saveBlob(blob: FsObject, store: KVStore): Promise<void> {
         const key = await this.put(store, blob.data, ObjectType.BLOB)
         myMap.set(blob, <ArrayBuffer>key);
    }

    private static async newBlob(data: ArrayBuffer, store: KVStore) {
        const blob: FsObject = {
            links: [],
            data
        };
        await this.saveBlob(blob, store);
        return blob;
    }

    private static checkObjType(obj: FsObject): ObjectType {
        return obj.links.length === 0 ? ObjectType.BLOB : ObjectType.LIST;
    }

    // 文件切片逻辑
    private static async sliceFile(file: File, store: KVStore): Promise<FsObject> {
        const nodeData = file.bytes();
        if (nodeData.byteLength <= BLOCK_LIMIT) {
            return this.newBlob(nodeData, store);
        }

        let linkLen = Math.ceil(nodeData.byteLength / BLOCK_LIMIT);
        let height = 0;
        for (let tmp = linkLen; tmp > 0; tmp = Math.floor(tmp / LIST_LIMIT)) {
            height++;
        }

        let seedId = 0;
        return (await this.dfsSliceList(height, file, store, seedId))[0];
    }

    private static async dfsSliceList(
        height: number,
        file: File,
        store: KVStore,
        seedId: number,
    ): Promise<[FsObject, number]> {
        if (height === 1) {
            return this.unionBlob(file, store, seedId);
        }

        const list: FsObject = { links: [], data: new ArrayBuffer(0) };
        let totalLen = 0;
        const nodeData = file.bytes();

        for (let i = 1; i <= LIST_LIMIT && seedId < nodeData.byteLength; i++) {
            const [tmp, len] = await this.dfsSliceList(height - 1, file, store, seedId);
            totalLen += len;
            const key = this.getKey(tmp);
            const typeName = this.checkObjType(tmp);
            this.appendActionAsList(list, <ArrayBuffer>key, len, typeName);
            seedId += len;
        }

        await this.saveObject(list, store, ObjectType.LIST);
        return [list, totalLen];
    }

    private static async unionBlob(
        file: File,
        store: KVStore,
        seedId: number,
    ): Promise<[FsObject, number]> {
        const nodeData = file.bytes();
        if (nodeData.byteLength - seedId <= BLOCK_LIMIT) {
            const data = nodeData.slice(seedId);
            const blob = await this.newBlob(data, store);
            return [blob, data.byteLength];
        }

        const list: FsObject = { links: [], data: new ArrayBuffer(0) };
        let totalLen = 0;

        for (let i = 1; i <= LIST_LIMIT && seedId < nodeData.byteLength; i++) {
            const end = Math.min(seedId + BLOCK_LIMIT, nodeData.byteLength);
            const data = nodeData.slice(seedId, end);
            const blob = await this.newBlob(data, store);
            totalLen += data.byteLength;
            const key = this.getKey(blob);
            this.appendActionAsList(list, <ArrayBuffer>key, data.byteLength, ObjectType.BLOB);
            seedId += data.byteLength;
        }

        await this.saveObject(list, store, ObjectType.LIST);
        return [list, totalLen];
    }

    // 目录处理
    private static async sliceDir(dir: Dir, store: KVStore): Promise<FsObject> {
        const tree: FsObject = { links: [], data: new ArrayBuffer(0) };
        const iter: DirIterator = dir.it();
        while (iter.next()) {
            const node = iter.node();
            switch (node.type()) {
                case NodeType.FILE: {
                    const file = <File>node;
                    const tmp = await this.sliceFile(file, store);
                    const key = this.getKey(tmp);
                    const typeName = this.checkObjType(tmp);
                    this.appendActionAsTree(tree, <ArrayBuffer>key, file.size(), file.name(), typeName);
                    break;
                }
                case NodeType.DIR: {
                    const subDir = <Dir>node;
                    const tmp = await this.sliceDir(subDir, store);
                    const key = this.getKey(tmp);
                    this.appendActionAsTree(tree, <ArrayBuffer>key, subDir.size(), subDir.name(), ObjectType.TREE);
                    break;
                }
            }
        }

        await this.saveObject(tree,  store, ObjectType.TREE);
        return tree;
    }
}


// 使用示例
// const sha256Hasher = crypto.createHash('sha256');
// const kvStore: KVStore = {
//     put: async (key, value) => { /* 实现存储逻辑 */ },
//     has: async (key) => { /* 实现存在性检查 */ }
// };
//
// // 创建示例文件节点
// const exampleFile: File = {
//     type: 'file',
//     name: 'test.txt',
//     size: 1024 * 1024 * 5, // 5MB
//     bytes: () => crypto.randomBytes(1024 * 1024 * 5)
// };
//
// // 执行添加操作
// FsObjectHelper.add(kvStore, exampleFile, sha256Hasher)
//     .then(rootHash => console.log('Root hash:', rootHash.toString('hex')))
//     .catch(console.error);