# Hello Kitty 生日派对游戏

一个可爱的互动式生日派对游戏，featuring一只智能的小猫咪！

## 功能特色

- 🐱 智能AI猫咪，会自主行动和互动
- 🎂 点击生日蛋糕获得祝福
- 💬 消息框跟随猫咪移动
- 📱 支持移动端触摸操作
- 🎮 双击控制猫咪移动

## 快速开始

### 方法1：使用代理服务器（推荐）

1. **安装Node.js**
   - 访问 [nodejs.org](https://nodejs.org/) 下载并安装

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动服务器**
   ```bash
   npm start
   ```
   或者双击 `start-server.bat`

4. **访问游戏**
   - 打开浏览器访问: http://localhost:3000

### 方法2：直接打开HTML文件

如果不想使用AI功能，可以直接打开 `hallokitty.html` 文件，游戏会自动使用模拟AI。

## 游戏操作

- **单击蛋糕**: 获得生日祝福
- **单击猫咪**: 与猫咪互动
- **双击空白处**: 控制猫咪移动到指定位置
- **移动端**: 支持触摸操作

## 技术架构

- **前端**: 原生JavaScript + Canvas
- **AI**: 阿里云通义千问API
- **代理服务器**: Express.js + CORS处理

## 文件结构

```
├── hallokitty.html          # 主页面
├── hallokitty.css           # 样式文件
├── hallokitty.js            # 游戏逻辑
├── proxy-server.js          # 代理服务器
├── package.json             # 依赖配置
├── start-server.bat         # Windows启动脚本
└── static/                  # 静态资源
    ├── Calico Farm Cat.png
    ├── birthdayCake.png
    ├── happyBirthDay.png
    ├── kitty-fly-ezgif.com-gif-to-sprite-converter.png
    └── kity-look.png
```

## 配置说明

在 `hallokitty.js` 中可以修改以下配置：

```javascript
CONFIG.AI = {
    API_KEY: "your-api-key",           // 阿里云API密钥
    MODEL: 'qwen-plus',                // AI模型
    API_URL: 'http://localhost:3000/api/proxy',  // API地址
    USE_MOCK_AI: false                 // 是否使用模拟AI
}
```

## 故障排除

### CORS错误
- 确保使用代理服务器访问 (http://localhost:3000)
- 或者设置 `USE_MOCK_AI: true` 使用模拟AI

### 服务器启动失败
- 检查Node.js是否正确安装
- 确保端口3000未被占用
- 运行 `npm install` 安装依赖

### AI不响应
- 检查API密钥是否正确
- 确认网络连接正常
- 查看浏览器控制台错误信息

## 开发说明

游戏采用模块化架构，主要包含以下系统：

- **DOMManager**: DOM元素管理
- **ResourceManager**: 资源加载管理
- **CharacterSystem**: 角色系统
- **AISystem**: AI逻辑系统
- **DialogueSystem**: 对话系统
- **PathfindingSystem**: 路径寻找系统
- **InteractionSystem**: 交互系统
- **GameController**: 游戏主控制器

## 许可证

MIT License