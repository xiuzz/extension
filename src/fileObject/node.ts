// 类型定义
export enum NodeType {
    FILE = 0,
    DIR = 1
}

export interface Node {
    size(): number;
    name(): string;
    type(): NodeType;
}

export interface File extends Node {
    bytes(): ArrayBuffer;
}

export interface Dir extends Node {
    it(): DirIterator;
}

export interface DirIterator {
    next(): boolean;
    node(): Node;
}


