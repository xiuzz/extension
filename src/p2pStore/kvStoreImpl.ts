import localforage from 'localforage';
import { ipfsNodeApi } from '../utils/chromeApi';
import {arrayBufferToString} from "../utils/globelTools.ts";
import {KVStore} from "./kvStore.ts";




// 初始化本地存储实例
const localStore = localforage.createInstance({
  name: 'ZStore',
  storeName: 'localCache'
});

class ZStore implements KVStore {
  // 检查键是否存在
  async has(key: ArrayBuffer): Promise<boolean> {
      const localValue = await localStore.getItem(arrayBufferToString(key));
      return localValue !== null
  }

  // 获取值
  async get(key: ArrayBuffer): Promise<any> {
    try {
      // 先在本地查找
      const localValue = await localStore.getItem(arrayBufferToString(key));
      if (localValue !== null) {
        return localValue;
      }

      // 如果本地没有，尝试从IPFS获取
      const ipfsValue = await ipfsNodeApi.get(arrayBufferToString(key));
      if (ipfsValue !== null) {
        // 将IPFS的值缓存到本地
        await localStore.setItem(arrayBufferToString(key), ipfsValue);
        return ipfsValue;
      }

      return null;
    } catch (error) {
      console.error('Error getting value:', error);
      return null;
    }
  }

  // 存储值
  async put(value: ArrayBuffer): Promise<ArrayBuffer|undefined> {
    try {
      // 同时存储到本地和IPFS
      const key: ArrayBuffer = await ipfsNodeApi.put(value);
      console.log("key:", key);
      if (await this.has(key)) return key;
      await Promise.all([
        localStore.setItem(key.toString(), value),
      ]);
    } catch (error) {
      console.error('Error storing value:', error);
      throw error;
    }
  }

  // 删除值
  async delete(key: ArrayBuffer): Promise<void> {
    await localStore.removeItem(arrayBufferToString(key));
  }

}

export const zStore = new ZStore();