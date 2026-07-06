const fs = require("fs");
const path = require("path");

const DEFAULT_PROVIDER = "deepseek";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";
const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

module.exports = async function handler(request, response) {
  setCorsHeaders(response);
  let question = "";
  let modelConfig = null;
  let matches = [];

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};
    question = String(body.question || "").trim();

    if (!question) {
      response.status(400).json({ error: "Question is required" });
      return;
    }

    modelConfig = getModelConfig();
    if (!modelConfig.apiKey) {
      response.status(500).json({ error: `${modelConfig.apiKeyName} is not configured` });
      return;
    }

    const knowledgeBase = loadKnowledgeBase();
    matches = retrieveKnowledge(question, knowledgeBase, 5);

    if (!matches.length) {
      const fallbackAnswer = "我目前的资料里还没有覆盖这个问题。你可以通过电话 18291980049 或邮箱 caoxi4929@qq.com 进一步联系我确认。";
      logAssistantInteraction(request, {
        question,
        answer: fallbackAnswer,
        sources: [],
        provider: modelConfig.provider,
        model: modelConfig.model,
        status: "no_match",
      });
      response.status(200).json({
        answer: fallbackAnswer,
        sources: [],
      });
      return;
    }

    const answer = sanitizeAnswer(await generateAnswer(modelConfig, question, matches));
    const finalAnswer = answer || "我找到了相关资料，但暂时没有生成出稳定回答。建议换一种问法再试一次。";
    logAssistantInteraction(request, {
      question,
      answer: finalAnswer,
      sources: matches.map((item) => item.title),
      provider: modelConfig.provider,
      model: modelConfig.model,
      status: answer ? "answered" : "empty_model_answer",
    });

    response.status(200).json({
      answer: finalAnswer,
      sources: matches.map((item) => item.title),
      provider: modelConfig.provider,
      model: modelConfig.model,
    });
  } catch (error) {
    logAssistantInteraction(request, {
      question,
      answer: "",
      sources: matches.map((item) => item.title),
      provider: modelConfig?.provider || "",
      model: modelConfig?.model || "",
      status: "error",
      error: error.message,
    });
    response.status(500).json({ error: "Resume assistant failed", detail: error.message });
  }
};

function getModelConfig() {
  const provider = String(process.env.LLM_PROVIDER || DEFAULT_PROVIDER).toLowerCase();

  if (provider === "openai") {
    return {
      provider,
      apiKeyName: "OPENAI_API_KEY",
      apiKey: process.env.OPENAI_API_KEY,
      endpoint: process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions",
      model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
    };
  }

  return {
    provider: "deepseek",
    apiKeyName: "DEEPSEEK_API_KEY",
    apiKey: process.env.DEEPSEEK_API_KEY,
    endpoint: process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/chat/completions",
    model: process.env.DEEPSEEK_MODEL || DEFAULT_DEEPSEEK_MODEL,
  };
}

async function generateAnswer(modelConfig, question, matches) {
  const context = matches
    .map((item, index) => {
      return [
        `资料 ${index + 1}: ${item.title}`,
        `关键词: ${(item.keywords || []).join("、")}`,
        `内容: ${item.snippet}`,
      ].join("\n");
    })
    .join("\n\n");

  const modelResponse = await fetch(modelConfig.endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${modelConfig.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelConfig.model,
      messages: [
        {
          role: "system",
          content:
            "你是个人求职主页里的 AI 简历助手，但回答时必须模拟候选人本人第一人称作答。所有回答统一使用“我负责”“我参与”“我擅长”“我的经验”等表达，不要出现“曹曦”“她”“该候选人”等第三人称称呼。你只能基于提供的知识库资料回答，不要编造未出现的公司、数据、项目或经历。回答风格要相对书面化、专业、克制，适合招聘者或面试官阅读。不要直接复制知识库原文，而要归纳为自然段或简洁条目。不要输出 Markdown 标记或标题符号，例如 #、*、**、-、>。不要标注资料来源。若资料不足，要明确说明“我目前的资料中未覆盖”，并建议通过电话或邮箱进一步沟通。输出中文，控制在 220 字以内。",
        },
        {
          role: "user",
          content: `问题：${question}\n\n可用资料：\n${context}`,
        },
      ],
      stream: false,
    }),
  });

  if (!modelResponse.ok) {
    const errorText = await modelResponse.text();
    throw new Error(`Model request failed: ${errorText.slice(0, 500)}`);
  }

  const result = await modelResponse.json();
  return extractChatCompletionText(result);
}

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function logAssistantInteraction(request, event) {
  const headers = request.headers || {};
  const getHeader = (name) => {
    if (typeof headers.get === "function") return headers.get(name) || "";
    return headers[name] || headers[name.toLowerCase()] || "";
  };

  const payload = {
    event: "resume_assistant_interaction",
    timestamp: new Date().toISOString(),
    status: event.status,
    question: event.question,
    answer: event.answer,
    sources: event.sources || [],
    provider: event.provider || "",
    model: event.model || "",
    origin: getHeader("origin"),
    referer: getHeader("referer"),
    userAgent: getHeader("user-agent"),
  };

  if (event.error) payload.error = event.error;
  console.log(JSON.stringify(payload));
}

function loadKnowledgeBase() {
  const candidates = [
    path.join(process.cwd(), "knowledge-base.js"),
    path.join(__dirname, "knowledge-base.js"),
    path.join(__dirname, "../../knowledge-base.js"),
  ];
  const filePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!filePath) throw new Error("knowledge-base.js was not found");

  const raw = fs.readFileSync(filePath, "utf8");
  const jsonText = raw
    .replace(/^window\.resumeKnowledgeBase\s*=\s*/, "")
    .replace(/;\s*$/, "");
  return JSON.parse(jsonText);
}

function retrieveKnowledge(question, knowledgeBase, limit) {
  return knowledgeBase
    .map((doc) => {
      const snippets = splitIntoSnippets(doc.content || "");
      const intentBoost = scoreIntent(doc, question);
      const bestSnippet = snippets
        .map((snippet) => ({ snippet, score: scoreText(`${doc.title} ${(doc.keywords || []).join(" ")} ${snippet}`, question) + intentBoost }))
        .sort((a, b) => b.score - a.score)[0];

      return {
        title: doc.title,
        keywords: doc.keywords || [],
        snippet: bestSnippet?.snippet || "",
        score: bestSnippet?.score || 0,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function scoreIntent(doc, question) {
  const text = `${doc.title} ${(doc.keywords || []).join(" ")}`;
  const q = String(question || "").toLowerCase();
  let score = 0;

  if (/优势|能力|擅长|强项|产品方向|适合|定位|介绍/.test(q) && /高频问题|职业定位/.test(text)) score += 18;
  if (/ai|agent|rag|大模型|智能体|简历助手/i.test(q) && /AI|简历网站|高频问题/i.test(text)) score += 18;
  if (/增长|会员|营销|付费|转化/.test(q) && /会员|付费会员|精细化|高频问题/.test(text)) score += 14;
  if (/项目|案例|做过|经历|经验/.test(q) && /项目知识库|高频问题/.test(text)) score += 10;

  return score;
}

function splitIntoSnippets(content) {
  return String(content || "")
    .split(/\n{2,}|(?=^#\s+)/m)
    .map((part) => part.replace(/^#+\s*/gm, "").replace(/\s+/g, " ").trim())
    .filter((part) => part.length >= 12)
    .map((part) => (part.length > 900 ? `${part.slice(0, 900)}...` : part));
}

function scoreText(textValue, question) {
  const textLower = String(textValue || "").toLowerCase();
  const terms = extractQueryTerms(question);
  return terms.reduce((score, term) => {
    if (!term) return score;
    if (textLower.includes(term)) return score + Math.min(term.length, 8);
    return score;
  }, 0);
}

function extractQueryTerms(question) {
  const normalized = String(question || "").toLowerCase();
  const asciiTerms = normalized.match(/[a-z0-9]+/g) || [];
  const chineseText = (normalized.match(/[\u4e00-\u9fa5]+/g) || []).join("");
  const chineseTerms = [];

  for (const size of [4, 3, 2]) {
    for (let index = 0; index <= chineseText.length - size; index += 1) {
      chineseTerms.push(chineseText.slice(index, index + size));
    }
  }

  return Array.from(new Set([...asciiTerms, ...chineseTerms])).filter((term) => term.length >= 2);
}

function extractChatCompletionText(result) {
  return String(result?.choices?.[0]?.message?.content || "").trim();
}

function sanitizeAnswer(answer) {
  return String(answer || "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*/g, "")
    .replace(/^\s*[-*>]\s*/gm, "")
    .replace(/曹曦/g, "我")
    .replace(/她(?=负责|参与|主导|擅长|具备|有|在|通过|曾|可以|能够|的)/g, "我")
    .replace(/该候选人/g, "我")
    .trim();
}
