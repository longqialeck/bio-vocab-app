# BioVocab API

生物词汇学习应用的后端API服务

## 功能

- 用户认证与授权
- 用户管理
- 词汇模块管理
- 词汇条目管理
- 学习进度跟踪
- Excel/CSV文件导入

## 技术栈

- Node.js
- Express
- MongoDB (Mongoose)
- JWT认证
- Bcrypt密码加密
- Multer文件上传

## 安装

1. 克隆仓库
```bash
git clone <repository-url>
cd bio-vocab-api
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
创建`.env`文件，并设置以下变量：
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/biovocab
JWT_SECRET=your_secret_key
NODE_ENV=development
```

4. 数据库初始化
```bash
npm run seed
```

## 启动

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

## API端点

### 认证
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 用户
- `GET /api/users` - 获取所有用户（管理员）
- `POST /api/users` - 创建用户（管理员）
- `PUT /api/users/:id` - 更新用户（管理员）
- `DELETE /api/users/:id` - 删除用户（管理员）

### 模块
- `GET /api/modules` - 获取所有模块
- `GET /api/modules/:id` - 获取单个模块
- `POST /api/modules` - 创建模块（管理员）
- `PUT /api/modules/:id` - 更新模块（管理员）
- `DELETE /api/modules/:id` - 删除模块（管理员）

### 词汇
- `GET /api/terms/module/:moduleId` - 获取模块中的词汇
- `GET /api/terms/:id` - 获取单个词汇
- `POST /api/terms` - 创建词汇（管理员）
- `PUT /api/terms/:id` - 更新词汇（管理员）
- `DELETE /api/terms/:id` - 删除词汇（管理员）
- `POST /api/terms/parse` - 解析Excel/CSV文件（管理员）
- `POST /api/terms/import` - 批量导入词汇（管理员）

### 学习进度
- `GET /api/progress` - 获取用户所有模块的学习进度
- `GET /api/progress/module/:moduleId` - 获取用户特定模块的学习进度
- `PUT /api/progress/module/:moduleId` - 更新用户的学习进度

## 默认管理员账户

- 邮箱: admin@biovocab.com
- 密码: admin123 