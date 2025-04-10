export const arrayBufferToString = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
        // 将每个字节转换为两位十六进制，并确保小写
        hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex.toLowerCase(); // 统一输出小写
};

export const arrayBufferToU8String = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let str = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        str += String.fromCharCode(bytes[i]);
    }
    return str;
};
export const hexStringToArrayBuffer = (hexStr: string): ArrayBuffer => {
    // 清理输入：移除非十六进制字符并统一为小写
    const cleanHex = hexStr.replace(/[^0-9a-fA-F]/g, '').toLowerCase();

    // 处理奇数长度情况：自动补前导零
    const validHex = cleanHex.length % 2 === 1
        ? '0' + cleanHex
        : cleanHex;

    // 创建缓冲区
    const buffer = new ArrayBuffer(validHex.length / 2);
    const view = new Uint8Array(buffer);

    // 每两个字符转换成一个字节
    for (let i = 0; i < validHex.length; i += 2) {
        const byteValue = parseInt(validHex.substr(i, 2), 16);
        if (isNaN(byteValue)) {
            throw new Error(`无效的十六进制字符: ${validHex.substr(i, 2)}`);
        }
        view[i/2] = byteValue;
    }

    return buffer;
};

export const stringToArrayBuffer = (str: string): ArrayBuffer => {
    const buffer = new ArrayBuffer(str.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < str.length; i++) {
        view[i] = str.charCodeAt(i);
    }
    return buffer;
};

export function appendBytes(originalBuffer: ArrayBuffer, newBytes: ArrayBuffer | Uint8Array): ArrayBuffer {
    // 将输入统一转换为 Uint8Array
    const newBytesArray = newBytes instanceof Uint8Array
        ? newBytes
        : new Uint8Array(newBytes);

    // 创建新缓冲区（原始长度 + 新数据长度）
    const mergedBuffer = new ArrayBuffer(
        originalBuffer.byteLength + newBytesArray.byteLength
    );

    // 使用视图操作二进制数据
    const mergedView = new Uint8Array(mergedBuffer);

    // 复制原始数据
    mergedView.set(new Uint8Array(originalBuffer), 0);

    // 追加新数据
    mergedView.set(newBytesArray, originalBuffer.byteLength);

    return mergedBuffer;
}
