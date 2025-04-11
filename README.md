# 生物词汇学习应用 (Bio Vocabulary App)

一个基于Vue3和Node.js的生物词汇学习应用，旨在帮助学生更高效地学习和记忆生物学专业词汇。

## 技术栈

### 前端
- Vue 3
- Vite
- Quasar Framework
- Pinia (状态管理)
- Vue Router
- Axios (HTTP请求)

### 后端
- Node.js
- Express
- MySQL/MariaDB (数据库)
- Sequelize (ORM)
- JWT (身份验证)
- Multer (文件上传)

## 项目架构

### 目录结构

```
bio-vocab-app/
│
├── src/                  # 前端源代码
│   ├── assets/           # 静态资源
│   ├── components/       # 公共组件
│   ├── layouts/          # 布局组件
│   ├── router/           # 路由配置
│   ├── stores/           # Pinia状态管理
│   ├── views/            # 页面视图
│   │   └── admin/        # 管理员界面
│   └── App.vue           # 根组件
│
├── bio-vocab-api/        # 后端API
│   ├── config/           # 配置文件
│   ├── controllers/      # 控制器
│   ├── middleware/       # 中间件
│   ├── models/           # 数据模型
│   ├── routes/           # 路由定义
│   ├── scripts/          # 脚本工具
│   ├── migrations/       # 数据库迁移
│   ├── seeders/          # 种子数据
│   ├── utils/            # 工具函数
│   ├── uploads/          # 上传文件目录
│   └── server.js         # 服务器入口
│
├── public/               # 公共静态资源
├── bio_vocab_list.csv    # 生物词汇CSV数据文件
└── ...
```

### 数据模型关系

- **User**: 用户信息和认证
- **Module**: 词汇模块分类
- **Term**: 词汇条目
- **Progress**: 学习总体进度
- **TermProgress**: 单词学习进度

## 主要功能

### 用户功能
- 用户认证与授权 (普通用户/管理员)
- 词汇模块选择与学习
- 学习进度跟踪与统计：
  - 已学单词数统计
  - 连续学习天数计算(学习streak)
  - 测验完成数统计
- 测验功能：
  - 单模块测验
  - 综合测验(多模块选择、多种题型)
- 个人资料管理

### 管理员功能
- 用户管理
- 词汇模块管理：
  - 创建、编辑、删除模块
  - 查看每个模块的词汇数量
- 词汇条目管理
- 从CSV/Excel导入词汇
- 数据分析与报告
- 管理员仪表盘：
  - 用户统计：总用户数、今日活跃用户、本周新增用户
  - 词汇统计：总模块数、总词汇量、本月新增词汇
  - 学习统计：已学习词汇数、今日学习词汇数、平均完成率

### 学习功能
- 自适应学习算法
- 进度追踪
- 学习记录统计

## 详细部署步骤

### 前置条件

- Node.js (v14+)
- MySQL/MariaDB (v5.7+/v10.3+)
- npm 或 yarn

### 1. 克隆与准备

1. 克隆项目仓库
   ```bash
   git clone https://github.com/your-username/bio-vocab-app.git
   cd bio-vocab-app
   ```

2. 安装前端依赖
   ```bash
   npm install
   ```

### 2. 数据库配置

1. 创建MySQL/MariaDB数据库
   ```sql
   CREATE DATABASE biovocab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. 配置数据库连接
   ```bash
   cd bio-vocab-api
   cp .env.sample .env
   ```

3. 编辑`.env`文件配置数据库连接信息
   ```
   PORT=5001
   NODE_ENV=development
   
   # MySQL/MariaDB数据库配置
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=biovocab
   DB_USER=your_db_username
   DB_PASSWORD=your_db_password
   
   # JWT配置
   JWT_SECRET=your_custom_jwt_secret_key
   
   # 文件上传路径
   UPLOAD_PATH=uploads
   ```

### 3. 后端API设置

1. 安装后端依赖
   ```bash
   cd bio-vocab-api
   npm install
   ```

2. 创建上传目录
   ```bash
   mkdir -p uploads
   ```

3. 初始化数据库表结构并创建管理员账户
   ```bash
   npm run db:create   # 创建数据库（如果尚未创建）
   npm run db:migrate  # 应用数据库迁移
   npm run db:seed     # 创建基础数据
   npm run admin:create  # 创建管理员账户
   ```
   这将创建一个管理员账户:
   - 邮箱: admin@biovocab.com
   - 密码: admin123

4. 导入生物词汇数据
   ```bash
   npm run import:vocab
   ```
   或者使用完整的清空并导入命令:
   ```bash
   node scripts/importVocabulary.js --clear-all
   ```
   
   该脚本将:
   - 从项目根目录的`bio_vocab_list.csv`文件导入词汇
   - 自动创建模块和分类
   - 导入所有词汇条目到数据库
   - 显示导入统计信息

### 4. 前端配置

1. 返回到项目根目录
   ```bash
   cd ..
   ```

2. 创建前端环境变量文件
   ```bash
   cp .env.local.example .env.local
   ```

3. 编辑`.env.local`文件，设置API地址
   ```
   VITE_API_URL=http://localhost:5001/api
   ```

### 5. 启动服务

1. 启动后端API服务器(在一个终端窗口)
   ```bash
   cd bio-vocab-api
   npm run dev
   ```

2. 启动前端开发服务器(在另一个终端窗口)
   ```bash
   # 在项目根目录
   npm run dev
   ```

3. 访问应用
   - 前端: http://localhost:3000 (或Vite提供的URL)
   - 后端API: http://localhost:5001/api

### 6. 生产环境部署

1. 构建前端
   ```bash
   # 在项目根目录
   npm run build
   ```
   
2. 配置生产环境变量
   在`bio-vocab-api/.env`文件中设置:
   ```
   NODE_ENV=production
   ```

3. 使用PM2或类似工具部署后端
   ```bash
   cd bio-vocab-api
   npm install pm2 -g
   pm2 start server.js --name "bio-vocab-api"
   ```

4. 使用Nginx或类似的Web服务器部署前端
   ```nginx
   # Nginx配置示例
   server {
     listen 80;
     server_name yourdomain.com;
     
     location / {
       root /path/to/bio-vocab-app/dist;
       index index.html;
       try_files $uri $uri/ /index.html;
     }
     
     location /api {
       proxy_pass http://localhost:5001;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

## API 参考

### 用户相关

- `POST /api/auth/login` - 用户登录
- `GET /api/users/me` - 获取当前用户信息
- `GET /api/users/dashboard/stats` - 获取管理员仪表盘统计数据

### 模块相关

- `GET /api/modules` - 获取所有模块(包含词汇数量)
- `GET /api/modules/:id` - 获取特定模块信息
- `GET /api/modules/:id/terms` - 获取模块的所有词汇

### 学习进度相关

- `GET /api/progress` - 获取用户学习进度
- `PUT /api/progress/module/:moduleId` - 更新特定模块的学习进度

## 更新记录

### 2023年Q3更新
- 添加用户统计功能：连续学习天数计算
- 添加词汇模块的词汇数量显示
- 添加管理员仪表盘统计功能
- 改进用户个人资料页面，显示更多学习统计

## 常见问题排查

### 模块导入后前端显示"No data available"

如果在管理页面的词汇管理没有显示任何模块，可能是因为:

1. 检查导入状态
   ```bash
   cd bio-vocab-api
   node debug-modules.js
   ```
   这将显示数据库中的模块情况

2. 如导入失败，检查错误信息并重新导入
   ```bash
   node scripts/importVocabulary.js --clear-all
   ```

3. 确认API服务正常运行
   创建一个测试脚本:
   ```bash
   node test-api.js
   ```
   如有问题，检查API响应和错误日志

4. 检查前端API连接配置
   确认`.env.local`中的`VITE_API_URL`设置正确

### 其他常见问题解决方案

1. 管理员账户解锁
   当登录失败次数过多（默认5次）时，账户会被自动锁定。使用以下命令解锁：
   ```bash
   cd bio-vocab-api
   npm run admin:unlock
   ```

2. 重置管理员密码
   如果忘记密码或密码验证持续失败，可以使用以下命令重置密码：
   ```bash
   cd bio-vocab-api
   npm run admin:reset-password
   ```
   这将把管理员密码重置为默认值：`admin123`

3. 学习进度未正确记录
   如果学习进度没有正确记录或显示，尝试以下步骤:
   - 确保用户已登录
   - 检查API服务器日志是否有错误信息
   - 在控制台查看网络请求是否成功
   - 重新启动前端和后端服务

## API端点参考

API端点详情:
- `/api/auth`: 认证相关(登录、注册)
- `/api/users`: 用户管理
- `/api/modules`: 模块管理
- `/api/terms`: 词汇管理
- `/api/progress`: 学习进度

## 许可证

[MIT](LICENSE)
