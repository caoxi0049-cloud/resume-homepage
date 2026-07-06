# AGENTS.md

## 项目概览

这是曹曦的个人求职主页，用于展示产品经理求职信息、工作经历、代表项目、教育背景，并提供简历下载与 AI 简历助手问答。

- 主线上地址：https://resumehomepage.netlify.app/
- GitHub 仓库：https://github.com/caoxi0049-cloud/resume-homepage
- 备用 GitHub Pages 地址：https://caoxi0049-cloud.github.io/resume-homepage/

前端使用原生 HTML、CSS、JavaScript。当前主站托管在 Netlify，并通过 Netlify Functions 提供 RAG 简历助手后端能力。项目没有前端构建步骤，没有前端框架，也没有包管理器依赖。

## 文件结构

- `index.html`：页面结构、语义容器和主要模块。
- `styles.css`：视觉样式、响应式布局、首页排版、工作经历卡片、AI 简历助手样式。
- `app.js`：页面数据渲染、语言切换、简历下载、AI 简历助手交互。
- `profile-data.js`：主要可编辑内容，包括基础信息、关于我卡片、工作经历、项目经历、教育背景、助手问题和兜底回答。
- `knowledge-base.js`：由 `AI简历助手知识库/*.txt` 生成的静态 RAG 知识库。
- `AI简历助手知识库/`：RAG 源文档目录，维护项目复盘、职业定位和高频问答。
- `api/resume-assistant.js`：RAG 简历助手后端核心逻辑，供 Vercel 或 Netlify wrapper 调用。
- `netlify/functions/resume-assistant.js`：Netlify Functions 入口。
- `assistant-config.js`：根据当前域名选择后端 API 地址。
- `netlify.toml`：Netlify 发布、Functions 和重定向配置。
- `assets/avatar.jpg`：当前首页人物照片。
- `assets/dmall-logo.png`：多点 Logo。
- `assets/xupt-logo.png`：西安邮电大学 Logo。
- `assets/resume.pdf`：下载简历文件。

## 本地维护流程

可以直接用浏览器打开 `index.html` 预览静态页面。注意：用 `file://` 打开时，AI 简历助手不会请求后端，会走前端本地兜底逻辑。

如需更接近线上行为，可用本地静态服务预览整个目录；但本地仍不会自动拥有 Netlify Functions 环境。

本机 Git 路径：

```powershell
D:\Programs\Git\cmd\git.exe status
D:\Programs\Git\cmd\git.exe add .
D:\Programs\Git\cmd\git.exe commit -m "Update resume homepage"
D:\Programs\Git\cmd\git.exe push
```

GitHub CLI 路径：

```powershell
D:\Programs\GitHubCLI\gh.exe
```

当前本地分支可能与远端 main 存在历史差异，因为部分发布曾通过 GitHub API 完成。普通 `git push` 若提示 `fetch first`，不要强推；优先基于远端 main 用 GitHub API 上传指定文件，避免覆盖远端历史。

## 内容编辑规则

`profile-data.js` 是简历内容的主要数据源。除非是页面结构调整，否则不要把简历正文硬编码到 `index.html`。

当前内容边界：

- 首页照片使用 `basics.heroAvatar`，当前为 `assets/avatar.jpg`。
- 首页只保留“下载简历”主按钮，不再保留“联系我”按钮或联系弹窗。
- 头部右侧展示公开联系方式：`18291980049 | caoxi4929@qq.com`。
- 首页“曾就职”展示“多点”和“好未来”。
- 关于我模块为四张能力卡片，不展示证件照头像。
- 工作经历模块当前结构为：公司名称、岗位、时间/方向、角色定位、核心成果卡片、重点项目详情。
- 工作经历公司名称使用“多点”和“好未来”，不要恢复成长公司全称，除非用户明确要求。
- 重点项目在页面上展示经过提炼后的内容，不要把简历或知识库全量搬到页面。
- 下载简历按钮依赖 `assets/resume.pdf`，下载文件名由 `basics.resumeFileName` 控制。

添加或修改中文内容时，保持 UTF-8 编码。PowerShell 有时会把中文显示成乱码，不要仅凭终端显示判断文件损坏；应结合浏览器或 UTF-8 读取方式确认。

## 视觉方向

当前风格是黑白极简的个人作品集/求职主页。

维护时默认保留这些设计约束：

- 主色调以黑、白、灰为主，少量蓝色和粉色只用于品牌字标。
- 首页保留大号中文职位标题“产品经理”。
- `PRODUCT MANAGER` 是标题下方的描边字，不要放到照片后方遮挡。
- 首页照片使用原图颜色，不加黑白滤镜。
- 首页首屏要尽量完整展示，避免用户进入页面后必须先下滑才能看到主要内容。
- AI 简历助手固定在右下角。
- 移动端要避免标题、照片、助手按钮互相遮挡。

不要随意添加复杂动画、重背景、渐变装饰或营销型首屏。

## AI 简历助手

当前正式方向是 RAG 文档增强问答，而不是只依赖简单关键词匹配。

现有机制：

- 助手入口是右下角消息图标。
- 页面打开 3 秒后，如果用户没有打开助手，会出现提示气泡。
- 用户打开助手后，本次会话不再重复显示提示气泡，状态通过 `sessionStorage` 保存。
- 在 `resumehomepage.netlify.app` 上，`assistant-config.js` 会请求 `/.netlify/functions/resume-assistant`。
- 在 `vercel.app` 上，会请求 `/api/resume-assistant`。
- 在本地 `file://` 打开时，`apiEndpoint` 为空，不请求后端，改走前端本地知识库和兜底回答。
- 线上用户每次通过后端 AI 助手提问，`api/resume-assistant.js` 都会输出一条结构化 JSON 日志，事件名为 `resume_assistant_interaction`，可在 Netlify Functions logs 中查看，用于复盘用户问题、回答质量、命中来源和后续知识库优化。

后端 RAG 逻辑：

- `api/resume-assistant.js` 读取 `knowledge-base.js`。
- 先检索相关知识片段，再调用大模型生成回答。
- 当前主要使用 DeepSeek 兼容 OpenAI Chat Completions 接口。
- API Key 只应配置在 Netlify 环境变量中，不要写入公开仓库。

回答要求：

- 回答应尽量使用第一人称，例如“我负责”“我擅长”。
- 不要用“曹曦”“她”“该候选人”等第三人称。
- 不输出 Markdown 标题、项目符号或来源标注。
- 不确定的问题应明确说明“我目前的资料中未覆盖”，并建议通过电话或邮箱联系确认。
- RAG 回答必须基于知识库内容，不要编造未验证经历、数据或业务细节。

## 发布流程

主站通过 Netlify 从 GitHub `main` 分支自动部署。

Netlify 配置：

- Publish directory：项目根目录 `.`
- Functions directory：`netlify/functions`
- 线上地址：https://resumehomepage.netlify.app/

提交并推送到 GitHub `main` 后，Netlify 会自动构建。

由于本地分支可能落后远端，普通 `git push origin main` 如果失败，不要使用强推。可用 GitHub CLI API 基于远端 main 创建提交，只上传本次需要发布的文件。

常用检查：

```powershell
D:\Programs\GitHubCLI\gh.exe api repos/caoxi0049-cloud/resume-homepage/git/ref/heads/main
```

发布后检查线上文件是否更新：

```powershell
Invoke-WebRequest -Uri "https://resumehomepage.netlify.app/profile-data.js?ts=$(Get-Date -UFormat %s)" -UseBasicParsing
```

如果浏览器仍显示旧样式或旧图片，优先使用 `Ctrl + F5` 强制刷新缓存。

## 发布前检查

这是公开求职主页。每次发布前检查：

- 手机号和邮箱是否确认可以公开。
- 是否包含未授权公开的公司内部数据。
- 是否包含 API Key、Token、本地路径或私密文件。
- `assets/resume.pdf` 是否由用户明确提供并允许发布。
- 首页照片和简历 PDF 是否使用了用户指定的最新版本。
- 本地无关文件不要提交，例如 `storage-clean-*.json`、临时二维码、临时导出 JSON 等。
