# AGENTS.md

## 项目概览

这是曹曦的个人求职主页，一个纯静态网站，已通过 GitHub Pages 发布。

- 线上地址：https://caoxi0049-cloud.github.io/resume-homepage/
- GitHub 仓库：https://github.com/caoxi0049-cloud/resume-homepage

项目使用原生 HTML、CSS、JavaScript 实现。没有构建步骤，没有前端框架，没有后端服务，也没有包管理器依赖。

## 文件结构

- `index.html`：页面结构、语义容器和主要模块。
- `styles.css`：视觉样式、响应式布局、首页排版、AI 简历助手样式。
- `app.js`：页面数据渲染、语言切换、联系弹层、AI 简历助手交互。
- `profile-data.js`：主要可编辑内容，包括个人信息、工作经历、教育背景、助手问题和回答。
- `assets/avatar.jpg`：关于我模块头像。
- `assets/hero-photo.jpg`：首页人物照片。
- `assets/resume.pdf`：简历下载文件。用户提供 PDF 后应放在这个路径。

## 本地维护流程

可以直接用浏览器打开 `index.html` 预览。若要更接近线上行为，可用本地静态服务预览整个目录。

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

## 内容编辑规则

`profile-data.js` 是简历内容的主要数据源。除非是页面结构调整，否则不要把简历正文硬编码到 `index.html`。

当前内容边界：

- 首页照片使用 `basics.heroAvatar`，当前为 `assets/hero-photo.jpg`。
- 关于我头像使用 `basics.avatar`，当前为 `assets/avatar.jpg`。
- 首页“曾服务于”仅展示用户指定的历史公司，目前为“多点”和“好未来”。
- 工作经历只展示公司级经历：多点生活、好未来。
- 重点项目可以保留在 AI 简历助手知识库里，但不要默认作为独立工作经历展示。
- 下载简历按钮依赖 `assets/resume.pdf`。如果文件缺失，应保留友好提示，不要让页面直接报错。

添加或修改中文内容时，保持 UTF-8 编码。PowerShell 有时会把中文显示成乱码，不要仅凭终端显示判断文件损坏；应结合浏览器或 UTF-8 读取方式确认。

## 视觉方向

当前风格是黑白极简的个人作品集/求职主页。

维护时默认保留这些设计约束：

- 主色调以黑、白、灰为主。
- 首页保留大号中文职位标题“产品经理”。
- `PRODUCT MANAGER` 是标题下方的描边字，不要放到照片后方遮挡。
- 头像和首页照片使用原图颜色，不加黑白滤镜。
- AI 简历助手固定在右下角。
- 移动端要避免标题、照片、助手按钮互相遮挡。

不要随意添加复杂动画、重背景、渐变装饰或营销型首屏。

## AI 简历助手

当前线上版本仍是前端本地问答，不接入真实大模型。这只是临时版本，用于保持 GitHub Pages 页面可用。

项目后续正式方向已经确定：AI 简历助手应升级为 RAG 文档增强问答，而不是继续依赖简单关键词匹配。

现有机制：

- 助手入口是右下角消息图标。
- 页面打开 3 秒后，如果用户没有打开助手，会出现提示气泡。
- 用户打开助手后，本次会话不再重复显示提示气泡，状态通过 `sessionStorage` 保存。
- 当前回答基于 `profile-data.js -> assistant.answers` 的关键词匹配，后续应被 RAG 检索与生成链路替代。

不要在这个公开仓库中写入任何模型 API Key、Token 或私密配置。

## RAG 方案决策

简历助手采用 RAG 方案。目标是让回答基于曹曦的简历、项目复盘、补充材料和常见面试问题，而不是只基于页面上展示的简历摘要。

推荐分阶段实现。

第一阶段：静态知识库增强

- 新增 `knowledge-base.js` 或 `knowledge-base.json`。
- 把简历、项目经历、项目复盘、常见面试问题拆成结构化知识片段。
- 前端根据问题进行文本检索和片段匹配。
- 仍然不接入大模型，保持 GitHub Pages 可直接运行。
- 这一阶段用于整理知识结构、验证问题覆盖度，并减少后续接入模型时的返工。

第二阶段：真实生成式 RAG

- 增加后端服务，例如 Vercel Functions、Netlify Functions 或 Cloudflare Workers。
- API Key 只放在后端环境变量中。
- 前端只调用自己的后端接口，不直接调用模型厂商接口。
- 后端完成问题改写、知识检索、提示词组装、模型回答和引用返回。
- GitHub Pages 可以继续作为前端托管；RAG API 单独部署到后端平台。

推荐架构：

```text
GitHub Pages 前端
  -> /api/resume-assistant
  -> 后端服务
  -> 检索 knowledge-base 文档片段
  -> 调用大模型生成回答
  -> 返回 answer + sources
```

推荐知识库字段：

```js
{
  id: "project-douyin-local-life",
  title: "抖音本地生活项目",
  type: "project",
  keywords: ["抖音", "本地生活", "团购券", "会员增长"],
  summary: "...",
  details: ["...", "..."],
  metrics: ["销售单量 7w+", "销售金额 1200w+", "券核销率 44.1%"],
  source: "resume"
}
```

RAG 回答必须基于知识库内容，不要编造未验证经历、数据或业务细节。

前端回答展示建议：

- 正文回答：自然语言回答访客问题。
- 依据来源：展示 1-3 个命中的知识片段标题。
- 不确定问题：明确说明“当前资料中未覆盖”，并建议访客通过电话或邮箱联系。

## 发布流程

项目通过 GitHub Pages 从 `main` 分支根目录发布。

发布配置：

- Branch：`main`
- Folder：`/`

提交并推送后，GitHub Pages 会自动构建。

查看 Pages 状态：

```powershell
D:\Programs\GitHubCLI\gh.exe api repos/caoxi0049-cloud/resume-homepage/pages --jq "{url:.html_url,status:.status}"
```

线上地址：

```text
https://caoxi0049-cloud.github.io/resume-homepage/
```

如果浏览器仍显示旧样式或旧图片，优先使用 `Ctrl + F5` 强制刷新缓存。

## 发布前检查

这是公开求职主页。每次发布前检查：

- 手机号和邮箱是否确认可以公开。
- 是否包含未授权公开的公司内部数据。
- 是否包含 API Key、Token、本地路径或私密文件。
- `assets/resume.pdf` 是否由用户明确提供并允许发布。
- 首页照片和关于我头像是否使用了用户指定图片。
