# 你的关系距离测试

一个基于 `Vite + React` 的移动端优先心理测试网页，可直接本地运行，也可部署到 Vercel。

## 本地启动

先安装依赖：

```bash
npm install
```

启动本地开发环境：

```bash
npm run dev
```

开发服务器启动后，按终端提示打开本地地址即可。

## 构建命令

生成生产环境静态文件：

```bash
npm run build
```

构建完成后，产物会输出到：

```bash
dist
```

如需本地预览构建结果：

```bash
npm run preview
```

## 部署到 Vercel

### 方式一：通过 Vercel 控制台导入 Git 仓库

1. 将项目推送到 GitHub、GitLab 或 Bitbucket。
2. 登录 [Vercel](https://vercel.com/)。
3. 点击 `Add New...` -> `Project`。
4. 选择你的仓库并导入。
5. Framework Preset 选择 `Vite`。
6. 确认以下构建配置：

```bash
Build Command: npm run build
Output Directory: dist
```

7. 点击 `Deploy`。

### 方式二：使用 Vercel CLI

先安装 Vercel CLI：

```bash
npm install -g vercel
```

然后在项目目录执行：

```bash
vercel
```

首次部署时，按提示选择当前目录并确认构建配置：

```bash
Build Command: npm run build
Output Directory: dist
```

后续正式发布可使用：

```bash
vercel --prod
```

## 项目说明

- 本项目为纯前端静态站点，不依赖后端。
- 所有题目、结果文案和计分逻辑均在前端代码中维护。
- 若只做文案或样式调整，通常无需额外修改 Vercel 配置。
