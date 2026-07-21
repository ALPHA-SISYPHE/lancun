/**
 * AI 识别接口地址
 * 部署后替换 YOUR_DEPLOYED_AI_API_URL 为已部署服务根地址
 * 默认：本地 ECNU 代理 server/ecnu-proxy.mjs
 */
const AI_RECOGNITION_API = 'http://127.0.0.1:8787';
// const AI_RECOGNITION_API = 'YOUR_DEPLOYED_AI_API_URL';

window.LANCUN_AI_RECOGNITION_API = AI_RECOGNITION_API;
window.AI_RECOGNITION_API = AI_RECOGNITION_API;
