import {NodeType, File, Node, Dir, DirIterator} from "./node.ts";
// 文件实现
export class ZLDFile implements File {
    constructor(
        private fileName: string,
        private fileData: ArrayBuffer
    ) {}

    size(): number {
        return this.fileData.byteLength;
    }

    name(): string {
        return this.fileName;
    }

    type(): NodeType {
        return NodeType.FILE;
    }

    bytes(): ArrayBuffer {
        return this.fileData;
    }
}

// 目录迭代器
export class ZldDirIter implements DirIterator {
    private index = -1;

    constructor(
        private nodes: Node[]
    ) {}

    next(): boolean {
        if (this.index + 1 < this.nodes.length) {
            this.index++;
            return true;
        }
        return false;
    }

    node(): Node {
        return this.nodes[this.index];
    }
}

// 目录实现
export class ZLDDir implements Dir {
    private nodes: Node[] = [];
    constructor(
        private dirName: string = ''
    ) {}

    size(): number {
        return this.nodes.reduce((sum, node) => sum + node.size(), 0);
    }

    name(): string {
        return this.dirName;
    }

    type(): NodeType {
        return NodeType.DIR;
    }

    it(): DirIterator {
        return new ZldDirIter([...this.nodes]);
    }

    addNode(node: Node): void {
        this.nodes.push(node);
    }
}

// 目录构建工具
// class FsBuilder {
//     static create(rootPath: string): ZLDDir {
//         const rootDir = new ZLDDir();
//         this.searchDir(rootPath, rootDir);
//         return rootDir;
//     }
//
//     private static searchDir(currentPath: string, parentDir: ZLDDir): void {
//         const items = fs.readdirSync(currentPath, { withFileTypes: true });
//
//         for (const item of items) {
//             const itemPath = path.join(currentPath, item.name);
//
//             if (item.isDirectory()) {
//                 const subDir = new ZLDDir(item.name);
//                 this.searchDir(itemPath, subDir);
//                 parentDir.addNode(subDir);
//             } else if (item.isFile()) {
//                 try {
//                     const data = fs.readFileSync(itemPath);
//                     parentDir.addNode(new ZLDFile(item.name, data));
//                 } catch (error) {
//                     // 处理文件读取错误
//                     if (error.code === 'EACCES') {
//                         console.error(`权限不足: ${itemPath}`);
//                     } else {
//                         console.error(`读取文件失败: ${itemPath}`, error);
//                     }
//                 }
//             }
//         }
//     }
// }

//
// // 使用示例
// const rootDir = FsBuilder.create('/path/to/directory');
// console.log('目录总大小:', rootDir.size());
//
// const iterator = rootDir.it();
// while (iterator.next()) {
//     const node = iterator.node();
//     console.log(`${node.type() === NodeType.DIR ? '目录' : '文件'}: ${node.name()}`);
// }