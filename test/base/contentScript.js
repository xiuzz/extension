/******/ (() => { // webpackBootstrap
/*!******************************!*\
  !*** ./src/contentScript.js ***!
  \******************************/
// 向页面注入脚本
function injectScript() {
    var script = document.createElement('script');
    script.src = chrome.runtime.getURL('injectScript.js');
    script.onload = function() {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
}
// 监听来自页面的消息
window.addEventListener('message', function(event) {
    // 确保消息来自我们期望的源
    if (event.source !== window) return;
    if (event.data.type && event.data.type === 'BC_EXTENSION_REQUEST') {
        var method = event.data.payload.method;
        var params = event.data.payload.params || {}; // 确保params始终是一个对象
        var requestId = event.data.id;
        console.log('Content script 接收请求详情:', {
            method: method,
            params: params,
            requestId: requestId,
            rawPayload: event.data.payload
        });
        // 所有请求都转发给background页面处理
        var message = {
            method: method,
            params: params,
            id: requestId,
            origin: window.location.origin
        };
        console.log('Content script 转发给background的消息详情:', message);
        chrome.runtime.sendMessage(message, function(response) {
            if (chrome.runtime.lastError) {
                console.error('发送消息错误:', chrome.runtime.lastError);
                // 响应错误
                window.postMessage({
                    type: 'BC_EXTENSION_RESPONSE',
                    id: requestId,
                    error: chrome.runtime.lastError.message || '扩展通信错误'
                }, '*');
                return;
            }
            console.log('Content script 接收响应详情:', {
                requestId: requestId,
                response: response,
                error: response === null || response === void 0 ? void 0 : response.error
            });
            // 处理来自background的响应
            window.postMessage({
                type: 'BC_EXTENSION_RESPONSE',
                id: requestId,
                payload: response,
                error: response === null || response === void 0 ? void 0 : response.error
            }, '*');
        });
    }
});
// 执行注入
injectScript();

/******/ })()
;
//# sourceMappingURL=contentScript.js.map