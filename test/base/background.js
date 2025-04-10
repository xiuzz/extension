/******/ (() => { // webpackBootstrap
/*!***************************!*\
  !*** ./src/background.js ***!
  \***************************/
// 存储已连接的网站
function _type_of(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
var connectedSites = new Set();
// 模拟账户信息
var accounts = [
    {
        address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
    }
];
// 存储等待响应的请求
var pendingRequests = {};
// 存储上传文件的缓存 (模拟)
var ipfsFileCache = new Map();
// 存储上传文件历史 (模拟)
var ipfsFileHistory = [];
// 处理扩展图标点击
chrome.action.onClicked.addListener(function() {
    chrome.tabs.create({
        url: 'popup.html'
    });
});
// 监听来自content script的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // 确保消息来自内容脚本
    if (!sender.tab) {
        console.log('忽略非内容脚本消息:', request);
        return false;
    }
    console.log('Background 收到请求详情:', {
        request: request,
        sender: {
            tab: sender.tab.id,
            url: sender.tab.url
        }
    });
    var origin = request.origin || (sender.tab.url ? new URL(sender.tab.url).origin : null);
    var method = request.method || request.type; // 兼容两种格式
    var params = request.params || {};
    console.log('Background 处理详情:', {
        origin: origin,
        method: method,
        params: params,
        methodType: typeof method === "undefined" ? "undefined" : _type_of(method)
    });
    // 处理IPFS相关请求
    if (method && method.startsWith('ipfs_')) {
        handleIpfsRequest(method, params, sendResponse);
        return true; // 异步响应
    }
    // 处理标准请求
    switch(method){
        case 'connect':
            handleConnect(origin, sendResponse);
            return true;
        case 'getAccounts':
            handleGetAccounts(origin, sendResponse);
            return true;
        case 'signMessage':
            handleSignMessage(origin, params === null || params === void 0 ? void 0 : params.message, sendResponse);
            return true;
        case 'add':
            handleadd(params, sendResponse);
            return true;
        case 'getIpfsFileHistory':
            console.log('调用getIpfsFileHistory处理函数');
            handleGetIpfsFileHistory(sendResponse);
            return true;
        case 'get':
            handleget(params, sendResponse);
            return true;
        default:
            console.error('不支持的请求类型:', method);
            sendResponse({
                error: '不支持的请求类型'
            });
            return false;
    }
});
// 处理来自弹窗的确认消息以及React组件的API请求
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // 处理连接响应
    if (request.type === 'connection_response') {
        var requestId = request.requestId, approved = request.approved, origin = request.origin;
        // 找到等待响应的请求
        if (pendingRequests[requestId]) {
            if (approved) {
                // 用户同意连接
                connectedSites.add(origin);
                pendingRequests[requestId].sendResponse({
                    success: true
                });
            } else {
                // 用户拒绝连接
                pendingRequests[requestId].sendResponse({
                    error: '用户拒绝连接'
                });
            }
            // 关闭相关的确认窗口
            if (pendingRequests[requestId].windowId) {
                chrome.windows.remove(pendingRequests[requestId].windowId);
            }
            // 删除请求
            delete pendingRequests[requestId];
        }
        sendResponse({
            success: true
        });
        return true;
    }
    // 处理签名响应
    if (request.type === 'signature_response') {
        var requestId1 = request.requestId, approved1 = request.approved, signature = request.signature;
        // 找到等待响应的请求
        if (pendingRequests[requestId1]) {
            if (approved1 && signature) {
                // 用户同意签名
                pendingRequests[requestId1].sendResponse({
                    signature: signature
                });
            } else {
                // 用户拒绝签名
                pendingRequests[requestId1].sendResponse({
                    error: '用户拒绝签名'
                });
            }
            // 关闭相关的确认窗口
            if (pendingRequests[requestId1].windowId) {
                chrome.windows.remove(pendingRequests[requestId1].windowId);
            }
            // 删除请求
            delete pendingRequests[requestId1];
        }
        sendResponse({
            success: true
        });
        return true;
    }
    // 获取已连接的网站列表
    if (request.type === 'getConnectedSites') {
        sendResponse({
            sites: Array.from(connectedSites)
        });
        return true;
    }
    // 获取当前激活的IPFS节点
    if (request.type === 'getCurrentIpfsNode') {
        chrome.storage.local.get([
            'ipfsNodes',
            'selectedIpfsNodeId'
        ], function(result) {
            var nodeId = result.selectedIpfsNodeId || "1";
            var nodes = result.ipfsNodes || DEFAULT_IPFS_NODES;
            var currentNode = nodes.find(function(node) {
                return node.id === nodeId;
            }) || null;
            sendResponse({
                currentNode: currentNode
            });
        });
        return true;
    }
    // 处理来自React组件的IPFS节点API请求
    if (request.type === 'getIpfsNodes') {
        chrome.storage.local.get('ipfsNodes', function(result) {
            sendResponse({
                nodes: result.ipfsNodes || DEFAULT_IPFS_NODES
            });
        });
        return true;
    }
    if (request.type === 'getSelectedIpfsNodeId') {
        chrome.storage.local.get('selectedIpfsNodeId', function(result) {
            sendResponse({
                nodeId: result.selectedIpfsNodeId || "1"
            });
        });
        return true;
    }
    if (request.type === 'saveIpfsNodes') {
        if (!request.nodes || !Array.isArray(request.nodes)) {
            sendResponse({
                error: '无效的节点数据'
            });
            return true;
        }
        chrome.storage.local.set({
            ipfsNodes: request.nodes
        }, function() {
            sendResponse({
                success: true
            });
        });
        return true;
    }
    if (request.type === 'setSelectedIpfsNodeId') {
        if (!request.nodeId) {
            sendResponse({
                error: '节点ID不能为空'
            });
            return true;
        }
        chrome.storage.local.set({
            selectedIpfsNodeId: request.nodeId
        }, function() {
            sendResponse({
                success: true
            });
        });
        return true;
    }
    if (request.type === 'testIpfsConnection') {
        if (!request.nodeId) {
            sendResponse({
                error: '节点ID不能为空'
            });
            return true;
        }
        chrome.storage.local.get('ipfsNodes', function(result) {
            var nodes = result.ipfsNodes || DEFAULT_IPFS_NODES;
            var node = nodes.find(function(n) {
                return n.id === request.nodeId;
            });
            if (!node) {
                sendResponse({
                    error: '未找到指定的节点'
                });
                return;
            }
            // 模拟连接测试
            setTimeout(function() {
                var isSuccess = Math.random() > 0.3;
                if (isSuccess) {
                    sendResponse({
                        success: true,
                        node: node
                    });
                } else {
                    sendResponse({
                        error: '连接超时或失败'
                    });
                }
            }, 800);
        });
        return true;
    }
});
// 处理IPFS相关请求
function handleIpfsRequest(method, params, sendResponse) {
    switch(method){
        case 'ipfs_getCurrentNode':
            chrome.storage.local.get([
                'ipfsNodes',
                'selectedIpfsNodeId'
            ], function(result) {
                var nodeId = result.selectedIpfsNodeId || "1";
                var nodes = result.ipfsNodes || DEFAULT_IPFS_NODES;
                var currentNode = nodes.find(function(node) {
                    return node.id === nodeId;
                }) || null;
                sendResponse({
                    currentNode: currentNode
                });
            });
            break;
        case 'ipfs_getNodes':
            chrome.storage.local.get('ipfsNodes', function(result) {
                sendResponse({
                    nodes: result.ipfsNodes || DEFAULT_IPFS_NODES
                });
            });
            break;
        case 'ipfs_switchNode':
            if (!(params === null || params === void 0 ? void 0 : params.nodeId)) {
                sendResponse({
                    error: '节点ID不能为空'
                });
                return;
            }
            chrome.storage.local.get('ipfsNodes', function(result) {
                var nodes = result.ipfsNodes || DEFAULT_IPFS_NODES;
                var node = nodes.find(function(n) {
                    return n.id === params.nodeId;
                });
                if (!node) {
                    sendResponse({
                        error: '未找到指定的节点'
                    });
                    return;
                }
                chrome.storage.local.set({
                    selectedIpfsNodeId: params.nodeId
                }, function() {
                    sendResponse({
                        success: true,
                        node: node
                    });
                });
            });
            break;
        case 'ipfs_add':
            if (!(params === null || params === void 0 ? void 0 : params.content)) {
                sendResponse({
                    error: '内容不能为空'
                });
                return;
            }
            // 模拟IPFS添加操作
            setTimeout(function() {
                try {
                    // 生成随机CID
                    var cid = 'Qm' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                    // 存储文件内容到缓存
                    ipfsFileCache.set(cid, {
                        content: params.content,
                        name: params.name || 'unnamed',
                        type: params.type || 'application/octet-stream',
                        size: params.size || params.content.length
                    });
                    // 如果缓存过大，删除最早的项目
                    if (ipfsFileCache.size > 100) {
                        var firstKey = ipfsFileCache.keys().next().value;
                        ipfsFileCache.delete(firstKey);
                    }
                    sendResponse({
                        cid: cid,
                        size: params.size || params.content.length
                    });
                } catch (error) {
                    sendResponse({
                        error: '上传文件失败: ' + error.message
                    });
                }
            }, 1000);
            break;
        case 'ipfs_get':
            if (!(params === null || params === void 0 ? void 0 : params.cid)) {
                sendResponse({
                    error: 'CID不能为空'
                });
                return;
            }
            // 模拟IPFS获取操作
            setTimeout(function() {
                try {
                    // 检查缓存中是否有此文件
                    if (ipfsFileCache.has(params.cid)) {
                        var fileData = ipfsFileCache.get(params.cid);
                        sendResponse({
                            content: fileData.content,
                            name: fileData.name,
                            mimeType: fileData.type
                        });
                        return;
                    }
                    // 如果没有找到文件但CID格式正确，返回模拟内容
                    if (params.cid.startsWith('Qm')) {
                        sendResponse({
                            content: 'IPFS内容: ' + params.cid,
                            name: 'ipfs-file.txt',
                            mimeType: 'text/plain'
                        });
                    } else {
                        sendResponse({
                            error: '无效的CID'
                        });
                    }
                } catch (error) {
                    sendResponse({
                        error: '获取文件失败: ' + error.message
                    });
                }
            }, 1000);
            break;
        case 'ipfs_testConnection':
            chrome.storage.local.get('ipfsNodes', function(result) {
                var nodes = result.ipfsNodes || DEFAULT_IPFS_NODES;
                var nodeId = params === null || params === void 0 ? void 0 : params.nodeId;
                var node = nodes.find(function(n) {
                    return n.id === nodeId;
                });
                if (!node) {
                    sendResponse({
                        error: '未找到指定的节点'
                    });
                    return;
                }
                // 模拟连接测试
                setTimeout(function() {
                    var isSuccess = Math.random() > 0.3;
                    if (isSuccess) {
                        sendResponse({
                            success: true,
                            node: node
                        });
                    } else {
                        sendResponse({
                            error: '连接超时或失败'
                        });
                    }
                }, 800);
            });
            break;
        default:
            sendResponse({
                error: '不支持的IPFS操作'
            });
    }
}
// 默认IPFS节点
var DEFAULT_IPFS_NODES = [
    {
        id: "1",
        name: "Infura IPFS",
        url: "https://ipfs.infura.io:5001"
    },
    {
        id: "2",
        name: "Cloudflare IPFS",
        url: "https://cloudflare-ipfs.com"
    },
    {
        id: "3",
        name: "Pinata",
        url: "https://api.pinata.cloud"
    },
    {
        id: "4",
        name: "Local Node",
        url: "http://localhost:5001"
    }
];
// 处理连接请求
function handleConnect(origin, sendResponse) {
    try {
        // 已连接的站点直接返回成功
        if (connectedSites.has(origin)) {
            console.log('站点已连接:', origin);
            sendResponse({
                success: true
            });
            return;
        }
        // 添加到连接站点列表（简化起见，跳过弹窗确认）
        console.log('添加站点到连接列表:', origin);
        connectedSites.add(origin);
        sendResponse({
            success: true
        });
    // 生成请求ID
    /*
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // 创建一个弹出窗口
    chrome.windows.create({
      url: `popup.html#/connect?origin=${encodeURIComponent(origin)}&requestId=${requestId}`,
      type: 'popup',
      width: 400,
      height: 400,
      focused: true
    }, (window) => {
      // 保存请求信息和窗口ID
      pendingRequests[requestId] = {
        sendResponse,
        origin,
        windowId: window.id
      };
    });
    */ } catch (error) {
        console.error('连接处理错误:', error);
        sendResponse({
            success: false,
            error: error.message
        });
    }
}
// 处理获取账户请求
function handleGetAccounts(origin, sendResponse) {
    if (!connectedSites.has(origin)) {
        console.log('网站未连接，无法获取账户:', origin);
        sendResponse({
            success: false,
            error: '网站未连接'
        });
        return;
    }
    console.log('返回账户信息');
    sendResponse({
        success: true,
        data: accounts
    });
}
// 处理签名消息请求
function handleSignMessage(origin, message, sendResponse) {
    if (!connectedSites.has(origin)) {
        sendResponse({
            error: '网站未连接'
        });
        return;
    }
    // 生成请求ID
    var requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    // 创建一个弹出窗口进行确认
    chrome.windows.create({
        url: "popup.html#/sign?origin=".concat(encodeURIComponent(origin), "&message=").concat(encodeURIComponent(message), "&requestId=").concat(requestId),
        type: 'popup',
        width: 400,
        height: 400,
        focused: true
    }, function(window) {
        // 保存请求信息和窗口ID
        pendingRequests[requestId] = {
            sendResponse: sendResponse,
            message: message,
            origin: origin,
            windowId: window.id
        };
    });
}
// 处理上传文件到IPFS的请求
function handleadd(data, sendResponse) {
    console.log('处理上传文件到IPFS请求:', data);
    try {
        // 模拟文件上传过程
        var file = data.file;
        // 生成一个随机的CID
        var cid = 'Qm' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        // 创建文件记录
        var fileRecord = {
            cid: cid,
            name: file.name,
            type: file.type,
            size: file.size,
            uploadTime: new Date().toISOString()
        };
        // 存储文件记录到缓存
        ipfsFileCache.set(cid, fileRecord);
        // 将文件记录添加到历史记录中
        ipfsFileHistory.push(fileRecord);
        // 只保留最近的20条记录
        if (ipfsFileHistory.length > 20) {
            ipfsFileHistory.shift();
        }
        // 将历史记录保存到本地存储
        chrome.storage.local.set({
            ipfsFileHistory: ipfsFileHistory
        });
        // 返回成功响应
        sendResponse({
            success: true,
            data: fileRecord
        });
    } catch (error) {
        console.error('上传文件失败:', error);
        sendResponse({
            success: false,
            error: error.message
        });
    }
}
// 处理获取IPFS文件历史的请求
function handleGetIpfsFileHistory(sendResponse) {
    console.log('处理获取IPFS文件历史请求');
    try {
        // 返回文件历史记录
        sendResponse({
            success: true,
            data: ipfsFileHistory
        });
    } catch (error) {
        console.error('获取文件历史失败:', error);
        sendResponse({
            success: false,
            error: error.message
        });
    }
}
// 处理下载IPFS文件的请求
function handleget(data, sendResponse) {
    console.log('处理下载IPFS文件请求:', data);
    try {
        var cid = data.cid;
        // 从缓存中获取文件
        if (ipfsFileCache.has(cid)) {
            var fileRecord = ipfsFileCache.get(cid);
            // 模拟文件下载
            sendResponse({
                success: true,
                data: fileRecord
            });
        } else {
            // 文件不存在
            sendResponse({
                success: false,
                error: '文件不存在或已过期'
            });
        }
    } catch (error) {
        console.error('下载文件失败:', error);
        sendResponse({
            success: false,
            error: error.message
        });
    }
}

/******/ })()
;
//# sourceMappingURL=background.js.map