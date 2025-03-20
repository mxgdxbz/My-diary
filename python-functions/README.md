# 日记精灵 Python 函数

这个目录包含用于日记精灵应用的 Python Cloud Functions。

## 设置开发环境

在开始开发或部署之前，请运行以下命令设置开发环境：

```bash
# 使脚本可执行
chmod +x setup.sh deploy.sh install-deps.sh

# 运行设置脚本
./setup.sh

# 安装 Node.js 依赖项
./install-deps.sh
```

这将安装所有必要的依赖项，包括：
- Firebase CLI
- Node.js 依赖项
- Python 依赖项（在虚拟环境中）

## 部署函数

设置完成后，您可以使用以下命令部署函数：

```bash
./deploy.sh
```

这将执行以下命令：
```bash
firebase deploy --only functions:python-functions:analyzeDiary
```

注意：`python-functions` 是 codebase 名称，`analyzeDiary` 是函数名称。

## 函数 URL

成功部署后，您的函数将可在以下 URL 访问：

```
https://us-central1.diary-darling.cloudfunctions.net/analyzeDiary
```

## 本地测试

要在本地测试函数，请运行：

```bash
# 激活虚拟环境
source venv/bin/activate  # Linux/Mac
# 或
.\venv\Scripts\activate   # Windows

# 启动 Firebase 模拟器
firebase emulators:start
```

本地测试 URL 将是：
```
http://localhost:5001/diary-darling/us-central1/analyzeDiary
```

## 故障排除

如果遇到部署错误，请尝试以下步骤：

1. 确保已安装 Firebase CLI：
   ```bash
   npm install -g firebase-tools
   ```

2. 登录到 Firebase：
   ```bash
   firebase login
   ```

3. 安装 Node.js 依赖项：
   ```bash
   ./install-deps.sh
   ```

4. 检查 `package.json` 和 `index.js` 文件是否正确配置

5. 确保 `firebase.json` 中的 codebase 配置正确：
   ```json
   "functions": [
     {
       "source": "functions",
       "codebase": "default",
       ...
     },
     {
       "source": "python-functions",
       "codebase": "python-functions",
       ...
     }
   ]
   ```

6. 如果仍然遇到问题，请尝试使用详细日志进行部署：
   ```bash
   firebase deploy --only functions:python-functions:analyzeDiary --debug
   ``` 