const fs = require("fs");
const path = require("path");

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-4.1-mini";

module.exports = async function handler(request, response) {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    response.status(500).json({ error: "OPENAI_API_KEY is not configured" });
    return;
  }

  try {
    const body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};
    const question = String(body.question || "").trim();

    if (!question) {
      response.status(400).json({ error: "Question is required" });
      return;
    }

    const knowledgeBase = loadKnowledgeBase();
    const matches = retrieveKnowledge(question, knowledgeBase, 5);

    if (!matches.length) {
      response.status(200).json({
        answer: "当前资料中还没有覆盖这个问题。你可以通过电话 18291980049 或邮箱 caoxi4929@qq.com 进一步联系曹曦确认。",
        sources: [],
      });
      return;
    }

    const context = matches
      .map((item, index) => {
        return [
          `资料 ${index + 1}: ${item.title}`,
          `关键词: ${(item.keywords || []).join("、")}`,
          `内容: ${item.snippet}`,
        ].join("\n");
      })
      .join("\n\n");

    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
        input: [
          {
            role: "system",
            content:
              "你是曹曦个人求职主页里的 AI 简历助手。你只能基于提供的知识库资料回答，不要编造未出现的公司、数据、项目或经历。回答要像一位专业招聘沟通助手：自然、精炼、有判断。不要直接复制知识库原文。若资料不足，要明确说明资料未覆盖，并建议电话或邮箱联系。输出中文，控制在 180 字以内；必要时用 2-3 个短要点。",
          },
          {
            role: "user",
            content: `问题：${question}\n\n可用资料：\n${context}`,
          },
        ],
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      response.status(502).json({ error: "Model request failed", detail: errorText.slice(0, 500) });
      return;
    }

    const result = await openaiResponse.json();
    const answer = extractResponseText(result);

    response.status(200).json({
      answer: answer || "我找到了相关资料，但暂时没有生成出稳定回答。建议换一种问法再试一次。",
      sources: matches.map((item) => item.title),
    });
  } catch (error) {
    response.status(500).json({ error: "Resume assistant failed", detail: error.message });
  }
};

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function loadKnowledgeBase() {
  const filePath = path.join(process.cwd(), "knowledge-base.js");
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
      const bestSnippet = snippets
        .map((snippet) => ({ snippet, score: scoreText(`${doc.title} ${(doc.keywords || []).join(" ")} ${snippet}`, question) }))
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

function extractResponseText(result) {
  if (typeof result.output_text === "string") return result.output_text.trim();

  const output = Array.isArray(result.output) ? result.output : [];
  return output
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .join("")
    .trim();
}
