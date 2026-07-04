# AI 简历助手后端 RAG 部署说明

当前项目已经从纯前端静态问答，调整为“前端优先调用后端 RAG”的架构。

## 为什么要接后端

GitHub Pages 只能托管静态页面，不能安全地保存模型 API Key，也不能运行后端检索和模型生成逻辑。

因此正式 RAG 需要一个后端接口：

```text
前端聊天窗口
  -> 后端 /api/resume-assistant
  -> 检索 knowledge-base.js
  -> 调用 OpenAI Responses API
  -> 返回 answer + sources
```

## 当前已完成

- 新增 `api/resume-assistant.js`：Vercel Serverless 后端接口。
- 新增 `assistant-config.js`：前端后端地址配置。
- 新增 `.env.example`：环境变量示例。
- 前端 `app.js` 已改成优先请求后端，后端不可用时再回退到本地兜底回答。

## 环境变量

部署后端时需要配置：

```text
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_MODEL=deepseek-v4-flash
ALLOWED_ORIGIN=https://caoxi0049-cloud.github.io
```

不要把真实 API Key 写进项目文件或提交到 GitHub。

如果要切回 OpenAI，可以配置：

```text
LLM_PROVIDER=openai
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_MODEL=gpt-4.1-mini
```

## 前端配置

如果整站部署到 Vercel，`assistant-config.js` 会自动使用：

```js
"/api/resume-assistant"
```

如果前端继续放在 GitHub Pages，后端单独部署到 Vercel，需要把 `assistant-config.js` 改成 Vercel 后端完整地址，例如：

```js
window.resumeAssistantConfig = {
  apiEndpoint: "https://your-vercel-app.vercel.app/api/resume-assistant",
};
```

## 推荐上线方式

更推荐把整站迁到 Vercel，因为前端和后端可以在同一个域名下运行，配置最少。

如果继续使用 GitHub Pages，也可以，只是需要单独维护后端域名。
