(function () {
  const data = window.profileData || {};
  const knowledgeBase = window.resumeKnowledgeBase || [];
  const assistantConfig = window.resumeAssistantConfig || {};
  const state = {
    language: localStorage.getItem("profile-language") || data.defaultLanguage || "zh",
    theme: localStorage.getItem("profile-theme") || "light",
    assistantOpen: false,
    contactOpen: false,
    nudgeReady: false,
    nudgeDismissed: sessionStorage.getItem("assistant-nudge-dismissed") === "true",
    messages: [],
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const text = (value) => {
    if (value && typeof value === "object") return value[state.language] || value.zh || value.en || "";
    return value || "";
  };

  function render() {
    const basics = data.basics || {};
    document.documentElement.lang = state.language === "en" ? "en" : "zh-CN";
    document.body.dataset.theme = state.theme;
    document.title = state.language === "en" ? "Career Homepage | Product Manager" : "\u4e2a\u4eba\u6c42\u804c\u4e3b\u9875 | \u4ea7\u54c1\u7ecf\u7406";

    setText('[data-field="brandName"]', basics.brandName);
    setText('[data-field="name"]', basics.name);
    setText('[data-field="initials"]', basics.initials);
    setText('[data-field="title"]', text(basics.title));
    setText('[data-field="heroGreeting"]', text(basics.heroGreeting));
    setText('[data-field="heroOutline"]', text(basics.heroOutline));
    setText('[data-field="statement"]', text(basics.statement));
    setText('[data-field="email"]', basics.email);
    setText('[data-field="phone"]', basics.phone);
    setText('[data-field="footerName"]', `${basics.name} · ${text(basics.title)}`);
    setText('[data-field="footerContact"]', `${basics.phone} · ${basics.email}`);
    $$("[data-i18n]").forEach((node) => {
      node.textContent = data.labels?.[state.language]?.[node.dataset.i18n] || node.textContent;
    });
    $$("[data-i18n-placeholder]").forEach((node) => {
      node.placeholder = data.labels?.[state.language]?.[node.dataset.i18nPlaceholder] || node.placeholder;
    });

    $('[data-action="toggle-language"]').textContent = state.language === "zh" ? "\u4e2d / EN" : "ZH / En";
    $('[data-action="toggle-theme"]').textContent = state.theme === "light" ? "☼" : "☾";

    $$('[data-field="emailLink"]').forEach((node) => {
      node.href = basics.email ? `mailto:${basics.email}` : "#";
    });
    $$('[data-field="phoneLink"]').forEach((node) => {
      node.href = basics.phone ? `tel:${basics.phone}` : "#";
    });
    $$('[data-field="resumeLink"], [data-field="aboutResumeLink"]').forEach((node) => {
      node.href = basics.resume || "#";
      if (basics.resumeFileName) node.setAttribute("download", basics.resumeFileName);
    });

    setupImage('[data-field="avatar"]', ".portrait-fallback", basics.heroAvatar || basics.avatar);
    setupImage('[data-field="avatarSmall"]', ".mini-fallback", basics.avatar);

    renderCompanyStrip();
    renderAboutCards();
    renderExperiences();
    renderEducation();
    renderAssistant(true);
    renderContact();
  }

  function setText(selector, value) {
    $$(selector).forEach((node) => {
      node.textContent = value || "";
    });
  }

  function label(key) {
    return data.labels?.[state.language]?.[key] || key;
  }

  function setupImage(imageSelector, fallbackSelector, src) {
    const image = $(imageSelector);
    const fallback = $(fallbackSelector);
    if (!image) return;
    image.hidden = false;
    image.src = src || "";
    image.onerror = () => {
      image.hidden = true;
      if (fallback) fallback.classList.add("is-visible");
    };
    image.onload = () => {
      if (fallback) fallback.classList.remove("is-visible");
    };
  }

  function renderCompanyStrip() {
    const target = $('[data-list="companyStrip"]');
    if (!target) return;
    target.innerHTML = (data.companyStrip || []).map((item) => `<strong>${escapeHtml(item)}</strong>`).join("");
  }

  function renderAboutCards() {
    const target = $('[data-list="aboutCards"]');
    if (!target) return;
    target.innerHTML = (data.about?.cards || [])
      .map(
        (card, index) => `
          <article class="about-card">
            <span class="about-card-index">${String(index + 1).padStart(2, "0")}</span>
            <h3>${escapeHtml(text(card.title))}</h3>
            <p class="about-card-subtitle">${escapeHtml(text(card.subtitle))}</p>
            <p class="about-card-detail">${escapeHtml(text(card.detail))}</p>
          </article>
        `
      )
      .join("");
  }

  function renderExperiences() {
    const target = $('[data-list="experiences"]');
    if (!target) return;
    target.innerHTML = (data.experiences || [])
      .map(
        (item) => `
          <article class="timeline-item">
            <div class="timeline-date">${escapeHtml(item.period)}</div>
            <div class="timeline-marker" aria-hidden="true"></div>
            <div class="timeline-content">
              <div class="experience-card-header">
                <div class="company-logo">
                  <img src="${escapeHtml(item.logo)}" alt="${escapeHtml(item.company)} Logo" />
                  <span>${escapeHtml(item.logoText || "PM")}</span>
                </div>
                <div class="job-line">
                  <div>
                    <h3>${escapeHtml(item.company)}</h3>
                    <p>${escapeHtml(text(item.role))}</p>
                  </div>
                  <span>${escapeHtml(item.period)}｜${escapeHtml(text(item.domain) || text(item.location))}</span>
                </div>
              </div>
              <h4>角色定位</h4>
              <div class="role-summary">
                <p>${escapeHtml(text(item.roleSummary))}</p>
              </div>
              ${
                (item.achievements || []).length
                  ? `
                    <h4>${escapeHtml(label("experience.achievements"))}</h4>
                    <div class="achievement-grid">
                      ${(item.achievements || [])
                        .map(
                          (achievement, index) => `
                            <article class="achievement-card">
                              <span>${String(index + 1).padStart(2, "0")}</span>
                              <h5>${escapeHtml(text(achievement.title))}</h5>
                              <p>${escapeHtml(text(achievement.detail))}</p>
                            </article>
                          `
                        )
                        .join("")}
                    </div>
                  `
                  : ""
              }
              <h4>${escapeHtml(label("experience.projects"))}</h4>
              <div class="project-list">
                ${(item.projects || [])
                  .map(
                    (project) => `
                      <section class="project-card">
                        <div class="project-title-line">
                          <h5>${escapeHtml(text(project.name))}</h5>
                          <div class="project-keywords">
                            ${(project.keywords || []).map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join("")}
                          </div>
                        </div>
                        <div class="project-detail-grid">
                          ${renderProjectDetail("项目定位", project.positioning)}
                          ${renderProjectDetail("负责什么", project.ownership)}
                          ${renderProjectDetail("产品亮点", project.highlight)}
                          ${text(project.result) ? renderProjectDetail("结果", project.result) : ""}
                        </div>
                      </section>
                    `
                  )
                  .join("")}
              </div>
            </div>
          </article>
        `
      )
      .join("");

    $$(".company-logo img").forEach((image) => {
      image.onerror = () => image.classList.add("is-hidden");
    });
  }

  function renderProjectDetail(title, value) {
    const content = text(value);
    if (!content) return "";
    return `
      <div class="project-detail">
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(content)}</p>
      </div>
    `;
  }

  function renderEducation() {
    const target = $('[data-list="education"]');
    if (!target) return;
    target.innerHTML = (data.education || [])
      .map(
        (item) => `
          <article class="education-item">
            <div class="education-date">${escapeHtml(item.period)}</div>
            <div class="company-logo school-logo">
              <img src="${escapeHtml(item.logo)}" alt="${escapeHtml(item.school)} Logo" />
              <span>${escapeHtml(item.logoText || "ED")}</span>
            </div>
            <div class="education-content">
              <div class="job-line">
                <div>
                  <h3>${escapeHtml(item.school)}</h3>
                  <p>${escapeHtml(`${text(item.major)} · ${text(item.degree)}`)}</p>
                </div>
                <span>${escapeHtml(text(item.location))}</span>
              </div>
              ${text(item.detail) ? `<p>${escapeHtml(text(item.detail))}</p>` : ""}
            </div>
          </article>
        `
      )
      .join("");
    $$(".school-logo img").forEach((image) => {
      image.onerror = () => image.classList.add("is-hidden");
    });
  }

  function renderAssistant(resetGreeting) {
    if (resetGreeting || state.messages.length === 0) {
      state.messages = [{ from: "assistant", content: text(data.assistant?.greeting) }];
    }
    const panel = $(".assistant-panel");
    if (panel) panel.dataset.state = state.assistantOpen ? "open" : "closed";
    const nudge = $(".assistant-nudge");
    if (nudge) nudge.dataset.state = state.nudgeReady && !state.assistantOpen && !state.nudgeDismissed ? "visible" : "hidden";

    const messages = $('[data-list="assistantMessages"]');
    if (messages) {
      messages.innerHTML = state.messages
        .map((message) => `<div class="message ${message.from}">${escapeHtml(message.content)}</div>`)
        .join("");
      messages.scrollTop = messages.scrollHeight;
    }

    const prompts = $('[data-list="assistantPrompts"]');
    if (prompts) {
      prompts.innerHTML = (data.assistant?.prompts || [])
        .map((prompt) => `<button type="button" data-question="${escapeHtml(text(prompt))}">${escapeHtml(text(prompt))}</button>`)
        .join("");
    }
  }

  function renderContact() {
    const panel = $(".contact-panel");
    if (panel) panel.dataset.state = state.contactOpen ? "open" : "closed";
  }

  async function askAssistant(question) {
    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;

    state.messages.push({ from: "user", content: cleanQuestion });
    state.messages.push({ from: "assistant", content: "我正在翻一翻项目资料，马上组织成一段好读的回答..." });
    renderAssistant(false);

    const backendAnswer = await askBackendAssistant(cleanQuestion);
    if (backendAnswer) {
      state.messages[state.messages.length - 1] = { from: "assistant", content: backendAnswer };
      renderAssistant(false);
      return;
    }

    const ragAnswer = answerFromKnowledgeBase(cleanQuestion);
    if (ragAnswer) {
      state.messages[state.messages.length - 1] = { from: "assistant", content: ragAnswer };
      renderAssistant(false);
      return;
    }

    const lower = cleanQuestion.toLowerCase();
    const match = (data.assistant?.answers || []).find((item) =>
      (item.keywords || []).some((keyword) => lower.includes(String(keyword).toLowerCase()))
    );
    state.messages[state.messages.length - 1] = { from: "assistant", content: text(match?.answer) || text(data.assistant?.fallback) };
    renderAssistant(false);
  }

  async function askBackendAssistant(question) {
    const endpoint = assistantConfig.apiEndpoint;
    if (!endpoint) return "";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) return "";

      const result = await response.json();
      const answer = String(result.answer || "").trim();
      if (!answer) return "";
      return answer;
    } catch (error) {
      return "";
    }
  }

  function answerFromKnowledgeBase(question) {
    if (!knowledgeBase.length) return "";
    const scoredDocs = knowledgeBase
      .map((doc) => {
        const snippets = rankSnippets(doc, question);
        const keywordScore = scoreText([doc.title, ...(doc.keywords || [])].join(" "), question) * 2;
        const contentScore = snippets.reduce((sum, item) => sum + item.score, 0);
        return { doc, snippets, score: keywordScore + contentScore };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (!scoredDocs.length) return "";

    const bestSnippets = scoredDocs
      .flatMap((item) => item.snippets.slice(0, 2).map((snippet) => ({ ...snippet, title: item.doc.title })))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (!bestSnippets.length) return "";

    return composeKnowledgeAnswer(question, scoredDocs, bestSnippets);
  }

  function composeKnowledgeAnswer(question, scoredDocs, bestSnippets) {
    const intent = inferQuestionIntent(question, scoredDocs);
    const relevantDocs = scoredDocs.filter((item) => describeKnowledgeDoc(item.doc, intent));
    const answerDocs = relevantDocs.length ? relevantDocs : scoredDocs;
    const takeaways = buildTakeaways(question, answerDocs, bestSnippets, intent);
    const metrics = extractMetrics(bestSnippets);
    const lines = [buildSummaryLine(intent, answerDocs)];

    if (takeaways.length) {
      lines.push("", "可以这样理解：");
      takeaways.slice(0, 3).forEach((item) => lines.push(`- ${item}`));
    }

    if (metrics.length) {
      lines.push("", "可量化信息：");
      metrics.slice(0, 3).forEach((item) => lines.push(`- ${item}`));
    }

    return lines.join("\n");
  }

  function inferQuestionIntent(question, scoredDocs) {
    const questionText = String(question || "").toLowerCase();
    if (/ai|agent|prompt|rag|大模型|智能体|简历助手/.test(questionText)) return "ai";
    if (/项目|案例|做过|经历|经验/.test(questionText)) return "project";
    if (/优势|能力|擅长|强项|特长/.test(questionText)) return "strength";
    if (/数据|效果|结果|指标|增长|转化/.test(questionText)) return "metric";
    if (/定位|介绍|是谁|背景/.test(questionText)) return "positioning";
    return "general";
  }

  function buildSummaryLine(intent, scoredDocs) {
    const mainTitle = scoredDocs[0]?.doc?.title || "当前知识库";
    const templates = {
      ai: `有相关经验。根据知识库，曹曦在 ${mainTitle} 中体现了 AI 产品与工具化落地的经验。`,
      project: `有可以展开说明的项目经验。最相关的材料来自 ${mainTitle}。`,
      strength: "从材料看，她的优势更偏向产品规划、跨团队推进和基于数据的业务判断。",
      metric: "知识库里有一些可量化的业务结果，可以作为评估她项目产出的参考。",
      positioning: "曹曦是偏业务增长、会员运营和产品规划的产品经理。",
      general: "我找到了与这个问题相关的材料，可以概括为以下几方面。",
    };
    return templates[intent] || templates.general;
  }

  function buildTakeaways(question, scoredDocs, snippets, intent) {
    const docTakeaways = scoredDocs
      .map((item) => describeKnowledgeDoc(item.doc, intent))
      .filter(Boolean);
    if (docTakeaways.length) return uniqueByNormalized(docTakeaways).slice(0, 3);

    const snippetTakeaways = snippets
      .map((snippet) => cleanSnippetText(snippet.text))
      .flatMap((textValue) => textValue.split(/[;；。]/))
      .map((line) => line.replace(/^[-*\d.、\s]+/, "").trim())
      .map(normalizeNarration)
      .filter((line) => line.length >= 8)
      .sort((a, b) => scoreText(b, question) - scoreText(a, question));

    return uniqueByNormalized([...docTakeaways, ...snippetTakeaways])
      .slice(0, 3)
      .map((line) => rewriteTakeaway(line, intent));
  }

  function describeKnowledgeDoc(doc, intent) {
    const title = doc?.title || "";
    const textValue = `${title} ${(doc?.keywords || []).join(" ")}`;
    if (intent === "ai" && !/AI|简历网站|RAG|Agent/i.test(textValue)) return "";
    if (intent === "strength" && !/高频问题|常见问题|职业定位/.test(textValue)) return "";
    if ((intent === "project" || intent === "metric") && /AI|简历网站|RAG|Agent/i.test(textValue)) return "";
    if (/高频问题|常见问题/.test(textValue)) {
      return "她的核心优势可以概括为商家中后台经验、复杂业务抽象、0-1 标准化建设，以及对结果指标的关注。";
    }
    if (/职业定位/.test(textValue)) {
      return "她更适合业务增长、会员运营、SaaS 中后台和商家服务方向的产品经理岗位。";
    }
    if (/AI|简历网站|RAG|Agent/i.test(textValue)) {
      return "她把个人求职主页设计成可交互的 AI 简历产品，并规划用 RAG 知识库补足传统简历难以展开的项目细节。";
    }
    if (/多平台|券|优惠券|抖音|美团|快手|支付宝/.test(textValue)) {
      return "她做过多平台券营销相关项目，重点是把外部流量渠道接入、券规则、核销和售后链路沉淀成可复用的产品能力。";
    }
    if (/付费会员/.test(textValue)) {
      return "她做过付费会员相关项目，围绕拉新转化、权益感知、存量挖潜和商家标准化配置来提升会员经营能力。";
    }
    if (/精细化|标签|会员/.test(textValue)) {
      return "她做过会员精细化运营升级，关注会员标签、分层运营、成长规则和运营效率提升。";
    }
    if (/SOP|班主任/.test(textValue)) {
      return "她做过班主任 SOP 线上化项目，把线下服务流程沉淀为可跟踪、可执行、可复用的系统流程。";
    }
    if (/问卷/.test(textValue)) {
      return "她做过问卷平台相关项目，偏 0-1 产品建设和内部业务工具标准化。";
    }
    return "";
  }

  function rewriteTakeaway(textValue, intent) {
    const line = limitSentence(textValue);
    if (/^(她|曹曦)/.test(line)) return line;
    if (/^(这个|该|项目|网站|平台)/.test(line)) return line;
    if (intent === "project" || intent === "ai") return `她在相关项目中${line.replace(/^[：:]\s*/, "")}`;
    if (intent === "metric") return `这一结果体现为${line.replace(/^[：:]\s*/, "")}`;
    if (intent === "strength") return `她的能力体现在${line.replace(/^[：:]\s*/, "")}`;
    return line;
  }

  function extractMetrics(snippets) {
    const metricPattern = /[^。；;\n]{0,18}\d+(?:\.\d+)?\s*(?:w\+|W\+|万\+|万|%|分钟|min|份|个月|家|次|人|\+)[^。；;\n]{0,18}/g;
    const matches = snippets.flatMap((snippet) => cleanSnippetText(snippet.text).match(metricPattern) || []);
    return uniqueByNormalized(matches.map((item) => limitSentence(item.trim()))).slice(0, 4);
  }

  function cleanSnippetText(textValue) {
    return String(textValue || "")
      .replace(/^#+\s*/gm, "")
      .replace(/^(Q|A|问|答)[：:]\s*/gim, "")
      .replace(/^[^-。；：:]{2,40}\s*-\s*[^。；：:]{2,24}[：:\s]*/, "")
      .replace(/^(项目名称|项目背景|项目动机|产品设计思路|核心职责|核心能力|项目成果|业务目标|解决方案|我的角色|个人定位)[：:\s]*/, "")
      .replace(/\*\*/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeNarration(textValue) {
    return String(textValue || "")
      .replace(/^(因此|所以)[，,]?\s*/, "")
      .replace(/\bHR\b/gi, "招聘方")
      .replace(/我的/g, "曹曦的")
      .replace(/我会/g, "她会")
      .replace(/我做/g, "她做")
      .replace(/我负责/g, "她负责")
      .replace(/我参与/g, "她参与")
      .replace(/我是/g, "她是")
      .replace(/我/g, "曹曦")
      .trim();
  }

  function uniqueByNormalized(items) {
    const seen = new Set();
    return items.filter((item) => {
      const key = String(item || "").replace(/\s+/g, "").replace(/[，。；、,.]/g, "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function limitSentence(textValue) {
    const textString = String(textValue || "").trim();
    if (textString.length <= 72) return textString;
    return `${textString.slice(0, 72)}...`;
  }

  function rankSnippets(doc, question) {
    return splitIntoSnippets(doc.content || "")
      .map((snippet) => ({ text: snippet, score: scoreText(snippet, question) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }

  function splitIntoSnippets(content) {
    return content
      .split(/\n{2,}|(?=^#\s+)/m)
      .map((part) => part.replace(/^#+\s*/gm, "").replace(/\s+/g, " ").trim())
      .filter((part) => part.length >= 12)
      .map((part) => (part.length > 180 ? `${part.slice(0, 180)}...` : part));
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
    for (let size of [4, 3, 2]) {
      for (let index = 0; index <= chineseText.length - size; index += 1) {
        chineseTerms.push(chineseText.slice(index, index + size));
      }
    }
    return Array.from(new Set([...asciiTerms, ...chineseTerms])).filter((term) => term.length >= 2);
  }

  function bindEvents() {
    $('[data-action="toggle-language"]')?.addEventListener("click", () => {
      state.language = state.language === "zh" ? "en" : "zh";
      localStorage.setItem("profile-language", state.language);
      render();
    });

    $('[data-action="toggle-theme"]')?.addEventListener("click", () => {
      state.theme = state.theme === "light" ? "dark" : "light";
      localStorage.setItem("profile-theme", state.theme);
      render();
    });

    $$('[data-action="toggle-contact"]').forEach((button) => {
      button.addEventListener("click", () => {
        state.contactOpen = !state.contactOpen;
        renderContact();
      });
    });

    $$('[data-field="resumeLink"], [data-field="aboutResumeLink"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");
        if (!href || href === "#") {
          event.preventDefault();
          alert(state.language === "zh" ? "请先把 PDF 简历放到 assets/resume.pdf" : "Please add the resume PDF to assets/resume.pdf first.");
        }
      });
    });

    $$('[data-action="toggle-assistant"]').forEach((button) => {
      button.addEventListener("click", () => {
        state.assistantOpen = !state.assistantOpen;
        state.nudgeDismissed = true;
        sessionStorage.setItem("assistant-nudge-dismissed", "true");
        renderAssistant(false);
      });
    });

    window.setTimeout(() => {
      if (state.assistantOpen || state.nudgeDismissed) return;
      state.nudgeReady = true;
      renderAssistant(false);
    }, 3000);

    $('[data-form="assistant"]')?.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = event.currentTarget.elements.question;
      askAssistant(input.value);
      input.value = "";
    });

    $('[data-list="assistantPrompts"]')?.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-question]");
      if (button) askAssistant(button.dataset.question);
    });

    const navLinks = $$(".nav-link");
    const sections = navLinks.map((link) => $(link.getAttribute("href"))).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
          });
        });
      },
      { rootMargin: "-42% 0px -48% 0px", threshold: 0 }
    );
    sections.forEach((section) => observer.observe(section));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  render();
  bindEvents();
})();
