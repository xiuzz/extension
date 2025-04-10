/******/ (() => { // webpackBootstrap
/*!*****************************!*\
  !*** ./src/injectScript.js ***!
  \*****************************/
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _async_to_generator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
function _ts_generator(thisArg, body) {
    var f, y, t, g, _ = {
        label: 0,
        sent: function() {
            if (t[0] & 1) throw t[1];
            return t[1];
        },
        trys: [],
        ops: []
    };
    return g = {
        next: verb(0),
        "throw": verb(1),
        "return": verb(2)
    }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
    }), g;
    function verb(n) {
        return function(v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while(_)try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch(op[0]){
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [
                        0
                    ];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [
                6,
                e
            ];
            y = 0;
        } finally{
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
}
// 初始化BC扩展对象
(function() {
    // 生成唯一ID用于追踪请求和响应
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    // 保存待处理的请求
    var pendingRequests = {};
    // 监听来自content script的消息
    window.addEventListener('message', function(event) {
        if (event.data.type === 'BC_EXTENSION_RESPONSE') {
            var _event_data = event.data, id = _event_data.id, payload = _event_data.payload, error = _event_data.error;
            // 找到并处理对应的promise
            if (pendingRequests[id]) {
                if (error) {
                    pendingRequests[id].reject(new Error(error));
                } else {
                    pendingRequests[id].resolve(payload);
                }
                // 移除已处理的请求
                delete pendingRequests[id];
            }
        }
    });
    // 发送请求到content script
    function sendRequest(method) {
        var params = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        return new Promise(function(resolve, reject) {
            var id = generateId();
            pendingRequests[id] = {
                resolve: resolve,
                reject: reject
            };
            var message = {
                type: 'BC_EXTENSION_REQUEST',
                id: id,
                payload: {
                    method: method,
                    params: params
                }
            };
            console.log('injectScript 发送请求:', method, params, message);
            window.postMessage(message, '*');
        });
    }
    // 定义BC扩展API
    var dsweb = {
        connect: // 连接到扩展
        function connect() {
            return _async_to_generator(function() {
                var error;
                return _ts_generator(this, function(_state) {
                    switch(_state.label){
                        case 0:
                            _state.trys.push([
                                0,
                                2,
                                ,
                                3
                            ]);
                            return [
                                4,
                                sendRequest('connect')
                            ];
                        case 1:
                            return [
                                2,
                                _state.sent()
                            ];
                        case 2:
                            error = _state.sent();
                            console.error('连接失败:', error);
                            throw error;
                        case 3:
                            return [
                                2
                            ];
                    }
                });
            })();
        },
        getAccounts: // 获取账户
        function getAccounts() {
            return _async_to_generator(function() {
                return _ts_generator(this, function(_state) {
                    return [
                        2,
                        sendRequest('getAccounts')
                    ];
                });
            })();
        },
        signMessage: // 签名消息
        function signMessage(message) {
            return _async_to_generator(function() {
                return _ts_generator(this, function(_state) {
                    return [
                        2,
                        sendRequest('signMessage', {
                            message: message
                        })
                    ];
                });
            })();
        },
        add: // 上传文件到IPFS
        function add(file) {
            return _async_to_generator(function() {
                var error;
                return _ts_generator(this, function(_state) {
                    switch(_state.label){
                        case 0:
                            _state.trys.push([
                                0,
                                2,
                                ,
                                3
                            ]);
                            return [
                                4,
                                sendRequest('add', {
                                    file: {
                                        name: file.name,
                                        type: file.type,
                                        size: file.size,
                                        content: 'mock-content-' + Math.random()
                                    }
                                })
                            ];
                        case 1:
                            return [
                                2,
                                _state.sent()
                            ];
                        case 2:
                            error = _state.sent();
                            console.error('上传文件失败:', error);
                            throw error;
                        case 3:
                            return [
                                2
                            ];
                    }
                });
            })();
        },
        getIpfsFileHistory: // 获取IPFS文件上传历史
        function getIpfsFileHistory() {
            return _async_to_generator(function() {
                var response, error;
                return _ts_generator(this, function(_state) {
                    switch(_state.label){
                        case 0:
                            _state.trys.push([
                                0,
                                2,
                                ,
                                3
                            ]);
                            console.log('发送getIpfsFileHistory请求');
                            return [
                                4,
                                sendRequest('getIpfsFileHistory', {})
                            ];
                        case 1:
                            response = _state.sent();
                            console.log('收到getIpfsFileHistory响应:', response);
                            return [
                                2,
                                response
                            ];
                        case 2:
                            error = _state.sent();
                            console.error('获取上传历史失败:', error);
                            throw error;
                        case 3:
                            return [
                                2
                            ];
                    }
                });
            })();
        },
        get: // 下载IPFS文件
        function get(cid) {
            return _async_to_generator(function() {
                var error;
                return _ts_generator(this, function(_state) {
                    switch(_state.label){
                        case 0:
                            _state.trys.push([
                                0,
                                2,
                                ,
                                3
                            ]);
                            return [
                                4,
                                sendRequest('get', {
                                    cid: cid
                                })
                            ];
                        case 1:
                            return [
                                2,
                                _state.sent()
                            ];
                        case 2:
                            error = _state.sent();
                            console.error('下载文件失败:', error);
                            throw error;
                        case 3:
                            return [
                                2
                            ];
                    }
                });
            })();
        },
        // IPFS相关API
        ipfs: {
            getCurrentNode: // 获取当前IPFS节点
            function getCurrentNode() {
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        return [
                            2,
                            sendRequest('ipfs_getCurrentNode')
                        ];
                    });
                })();
            },
            getNodes: // 获取所有可用IPFS节点·
            function getNodes() {
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        return [
                            2,
                            sendRequest('ipfs_getNodes')
                        ];
                    });
                })();
            },
            switchNode: // 切换IPFS节点
            function switchNode(nodeId) {
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        return [
                            2,
                            sendRequest('ipfs_switchNode', {
                                nodeId: nodeId
                            })
                        ];
                    });
                })();
            },
            add: // 上传文件到IPFS (模拟)
            function add(content) {
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        return [
                            2,
                            sendRequest('ipfs_add', {
                                content: content
                            })
                        ];
                    });
                })();
            },
            get: // 从IPFS获取内容 (模拟)
            function get(cid) {
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        return [
                            2,
                            sendRequest('ipfs_get', {
                                cid: cid
                            })
                        ];
                    });
                })();
            },
            testConnection: // 测试IPFS节点连接
            function testConnection(nodeId) {
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        return [
                            2,
                            sendRequest('ipfs_testConnection', {
                                nodeId: nodeId
                            })
                        ];
                    });
                })();
            }
        }
    };
    // 将API对象注入到window对象
    window.dsweb = dsweb;
})();

/******/ })()
;
//# sourceMappingURL=injectScript.js.map