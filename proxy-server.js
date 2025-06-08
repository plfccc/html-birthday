const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 3000;

// 启用CORS
app.use(cors());

// 静态文件服务（为前端文件提供服务）
app.use(express.static(__dirname));

// 代理阿里云API请求
app.use('/api/proxy', createProxyMiddleware({
  target: 'https://dashscope.aliyuncs.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/proxy': '/api/v1/services/aigc/text-generation/generation'
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('代理请求:', req.method, req.url);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('代理响应:', proxyRes.statusCode);
  },
  onError: (err, req, res) => {
    console.error('代理错误:', err.message);
    res.status(500).json({ error: '代理服务器错误' });
  }
}));

// 主页路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'hallokitty.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 代理服务器已启动！`);
  console.log(`📱 访问地址: http://localhost:${PORT}`);
  console.log(`🔗 API代理地址: http://localhost:${PORT}/api/proxy`);
  console.log(`\n使用说明:`);
  console.log(`1. 在浏览器中访问 http://localhost:${PORT}`);
  console.log(`2. 现在可以正常使用AI功能，无需担心CORS问题`);
  console.log(`\n停止服务器: Ctrl+C`);
});