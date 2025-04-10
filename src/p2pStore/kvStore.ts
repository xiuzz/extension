export interface KVStore {
    has(key: ArrayBuffer): Promise<boolean>;
    put(value: ArrayBuffer): Promise<ArrayBuffer|undefined>;
    get(key: ArrayBuffer): Promise<ArrayBuffer>;
    delete(key: ArrayBuffer): Promise<void>;
}