interface Link {
    name: string;
    hash: ArrayBuffer;
    size: number;
}

interface FsObject {
    links: Link[];
    data: Uint8Array;
}


interface KVStore {
    has(hash: ArrayBuffer): Promise<boolean>;
    get(hash: ArrayBuffer): Promise<ArrayBuffer>;
}

const STEP = 4;
const TEXT_DECODER = new TextDecoder();

// 主入口函数
export async function hash2File(
    store: KVStore,
    hash: ArrayBuffer,
    path: string
): Promise<ArrayBuffer | null> {
    const exists = await store.has(hash);
    if (!exists) return null;

    const objBinary = await store.get(hash);
    const obj = binaryToObj(objBinary);
    const pathArr = path.split("/").filter(p => p !== ""); // 清理空路径段
    return getFileByDir(obj, pathArr, 0, store);
}

// 递归目录查找
export async function getFileByDir(
    obj: FsObject,
    pathArr: string[],
    depth: number,
    store: KVStore
): Promise<ArrayBuffer | null> {
    if (depth >= pathArr.length) return null;

    const target = pathArr[depth];
    let typeIndex = 0;

    for (const link of obj.links) {
        const typeBytes = obj.data.subarray(typeIndex, typeIndex + STEP);
        const objType = TEXT_DECODER.decode(typeBytes);
        typeIndex += STEP;

        if (link.name !== target) continue;

        switch (objType) {
            case "TREE":
                const dirHash = link.hash;
                const dirObj = binaryToObj(await store.get(dirHash));
                const result = await getFileByDir(dirObj, pathArr, depth + 1, store);
                if (result) return result;
                break;

            case "BLOB":
                return store.get(link.hash);

            case "LIST":
                const listHash = link.hash;
                const listObj = binaryToObj(await store.get(listHash));
                return getFileByList(listObj, store);
        }
    }

    return null;
}

// 处理链表结构
async function getFileByList(
    obj: FsObject,
    store: KVStore
): Promise<ArrayBuffer> {
    const chunks: ArrayBuffer[] = [];
    let typeIndex = 0;

    for (const link of obj.links) {
        const typeBytes = obj.data.subarray(typeIndex, typeIndex + STEP);
        const objType = TEXT_DECODER.decode(typeBytes);
        typeIndex += STEP;

        const chunk = await store.get(link.hash);
        if (objType === "BLOB") {
            chunks.push(chunk);
        } else {
            const listObj = binaryToObj(chunk);
            chunks.push(await getFileByList(listObj, store));
        }
    }

    return concatArrayBuffers(chunks);
}

// ArrayBuffer工具函数
function concatArrayBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
    const total = buffers.reduce((sum, b) => sum + b.byteLength, 0);
    const result = new Uint8Array(total);
    let offset = 0;

    buffers.forEach(buf => {
        result.set(new Uint8Array(buf), offset);
        offset += buf.byteLength;
    });

    return result.buffer;
}

// 反序列化函数
function binaryToObj(buffer: ArrayBuffer): FsObject {
    const { links, data } = JSON.parse(
        TEXT_DECODER.decode(buffer),
        (key, value) => {
            if (key === "hash") return base64ToArrayBuffer(value);
            if (key === "data") return base64ToArrayBuffer(value);
            return value;
        }
    );

    return {
        links: links.map((link: any) => ({
            name: link.name,
            hash: base64ToArrayBuffer(link.hash),
            size: link.size
        })),
        data: new Uint8Array(data)
    };
}


function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const buffer = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
        view[i] = binary.charCodeAt(i);
    }
    return buffer;
}