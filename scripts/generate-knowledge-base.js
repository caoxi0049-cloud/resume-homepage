const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.join(rootDir, "AI简历助手知识库");
const outputFile = path.join(rootDir, "knowledge-base.js");

const files = fs
  .readdirSync(sourceDir)
  .filter((file) => file.toLowerCase().endsWith(".txt"))
  .sort((a, b) => a.localeCompare(b, "zh-CN"));

const docs = files.map((file) => {
  const filePath = path.join(sourceDir, file);
  const content = fs.readFileSync(filePath, "utf8").replace(/\uFEFF/g, "").trim();
  const baseName = path.basename(file, ".txt");
  const headings = Array.from(content.matchAll(/^#+\s*(.+)$/gm)).map((match) => match[1].trim());
  const keywordParts = [baseName, ...baseName.split(/[-_\s]+/), ...headings].filter(Boolean);

  return {
    id: baseName,
    title: baseName,
    type: baseName.includes("高频") ? "faq" : "project",
    keywords: Array.from(new Set(keywordParts)),
    content,
    source: file,
  };
});

fs.writeFileSync(
  outputFile,
  `window.resumeKnowledgeBase = ${JSON.stringify(docs, null, 2)};\n`,
  "utf8",
);

console.log(`Generated ${path.relative(rootDir, outputFile)} from ${docs.length} source files.`);
