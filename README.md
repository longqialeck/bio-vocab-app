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
- MongoDB (数据库)
- Mongoose (ODM)
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
│   ├── seeds/            # 种子数据
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
- **Term/Vocabulary**: 词汇条目
- **Progress**: 学习进度跟踪

## 主要功能

- 用户认证与授权 (普通用户/管理员)
- 词汇模块管理
- 词汇条目管理
- 从CSV/Excel导入词汇
- 学习进度跟踪
- 自适应学习算法
- 测验功能：
  - 单模块测验
  - 综合测验(多模块选择、多种题型)
- 数据分析与报告

## 安装部署步骤

### 前置条件

- Node.js (v14+)
- MongoDB (v4+)
- npm 或 yarn

### 安装前端

1. 克隆项目仓库
   ```bash
   git clone https://github.com/your-username/bio-vocab-app.git
   cd bio-vocab-app
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 配置环境变量
   - 复制`.env.example`为`.env.local`
   - 根据需要修改相关配置

4. 启动开发服务器
   ```bash
   npm run dev
   ```

### 安装后端

1. 进入API目录
   ```bash
   cd bio-vocab-api
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 配置环境变量
   - 复制`.env.example`为`.env`
   - 设置MongoDB连接URL和JWT密钥
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/biovocab
   JWT_SECRET=your_secret_key
   NODE_ENV=development
   ```

4. 创建uploads目录
   ```bash
   mkdir -p uploads
   ```

### 初始化数据库

1. 创建管理员账户
   ```bash
   cd bio-vocab-api
   node createAdmin.js
   ```
   这将创建一个管理员账户:
   - 邮箱: admin@biovocab.com
   - 密码: admin123

2. 导入生物词汇数据
   ```bash
   cd bio-vocab-api
   node importVocabulary.js
   ```
   该脚本将:
   - 从项目根目录的`bio_vocab_list.csv`文件导入词汇
   - 自动创建模块和分类
   - 导入所有词汇条目到数据库
   - 显示导入统计信息
   
   注意：此脚本会添加或更新词汇，但不会删除现有数据。

3. 清空并重新导入词汇数据
   ```bash
   cd bio-vocab-api
   node importVocabulary.js --clear-all
   ```
   该脚本使用`--clear-all`参数将:
   - 删除不在CSV文件中的所有模块及其词汇
   - 清空CSV文件中存在的模块的词汇，以便重新导入
   - 从CSV文件导入全新词汇，并避免重复
   - 自动更新模块的词汇计数
   - 显示详细的导入统计信息

4. 修复模块名称格式（在导入后运行）
   ```bash
   cd bio-vocab-api
   node fixModuleNames.js
   ```
   该脚本将:
   - 将"Unit X: Subject"格式的模块名称转换为前端界面兼容的简短名称
   - 保持模块ID不变，确保关联的词汇条目保持连接
   - 在导入词汇后需要运行此脚本，以确保前端界面正确显示模块

5. 启动API服务器
   ```bash
   npm run dev
   ```

### 生产环境部署

1. 构建前端
   ```bash
   # 在项目根目录
   npm run build
   ```

2. 部署后端
   ```bash
   cd bio-vocab-api
   npm install --production
   npm start
   ```

## 使用说明

### 管理员账户

初始管理员账户:
- 邮箱: admin@biovocab.com
- 密码: admin123

管理员可以:
- 管理用户账户
- 创建和编辑词汇模块
- 添加和修改词汇条目
- 导入/导出词汇数据
- 查看学习统计和报告

### 测验功能

系统提供两种测验模式:

1. **单模块测验**
   - 针对特定模块的词汇进行测试
   - 选择题形式
   - 计时答题
   - 结果统计和反馈

2. **综合测验**
   - 可选择多个模块进行组合测试
   - 支持选择题和拼写题两种题型
   - 支持英文→中文和中文→英文双向测试
   - 可设置测验难度、题目数量和是否随机排序
   - 详细的结果分析和错题复习列表
   - 按模块记录学习进度

### 词汇导入格式

CSV文件格式应包含以下列:
- 英文单词名: 英文词汇
- 中文单词名: 中文翻译
- 单词中文描述: 定义
- 所属单元: 模块名称(如"Unit 1: Cell Biology")
- 单词重要等级: 重要程度(高/中/低)

## 管理员账户维护

如果遇到管理员账户的登录问题，可以使用以下脚本进行维护：

### 解锁管理员账户

当登录失败次数过多（默认5次）时，账户会被自动锁定。使用以下命令解锁：

```bash
cd bio-vocab-api
node unlockAdmin.js
```

### 重置管理员密码

如果忘记密码或密码验证持续失败，可以使用以下命令重置密码：

```bash
cd bio-vocab-api
node resetAdminPassword.js
```

这将把管理员密码重置为默认值：`admin123`

## 开发者文档

### API端点

API端点详情请参阅 `/bio-vocab-api/routes/` 目录下的路由文件:
- `/api/auth`: 认证相关
- `/api/users`: 用户管理
- `/api/modules`: 模块管理
- `/api/vocabulary`: 词汇管理
- `/api/terms`: 词条管理(兼容性API)
- `/api/progress`: 学习进度

## 故障排除

### 模块词汇计数显示为0

如果模块词汇计数显示为0，可能是导入后没有正确更新计数值。解决方法:

```bash
cd bio-vocab-api
node importVocabulary.js --clear-all
```

这将重新导入词汇并更新所有模块的词汇计数。

### 学习进度未正确记录

如果学习进度没有正确记录或显示，尝试以下步骤:

1. 确保用户已登录
2. 检查API服务器日志是否有错误信息
3. 在控制台查看网络请求是否成功
4. 重新启动前端和后端服务

## 许可证

[MIT](LICENSE)
