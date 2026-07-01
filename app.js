(function () {
  const data = window.profileData || {};
  const state = {
    language: localStorage.getItem("profile-language") || data.defaultLanguage || "zh",
    theme: localStorage.getItem("profile-theme") || "light",
    assistantOpen: false,
    contactOpen: false,
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
    setText('[data-field="aboutIntro"]', text(data.about?.intro));
    setText('[data-field="aboutDetail"]', text(data.about?.detail));

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
    });

    setupImage('[data-field="avatar"]', ".portrait-fallback", basics.avatar);
    setupImage('[data-field="avatarSmall"]', ".mini-fallback", basics.avatar);

    renderCompanyStrip();
    renderTags();
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

  function renderTags() {
    const target = $('[data-list="abilityTags"]');
    if (!target) return;
    target.innerHTML = (data.about?.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
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
            <div class="company-logo">
              <img src="${escapeHtml(item.logo)}" alt="${escapeHtml(item.company)} Logo" />
              <span>${escapeHtml(item.logoText || "PM")}</span>
            </div>
            <div class="timeline-content">
              <div class="job-line">
                <div>
                  <h3>${escapeHtml(text(item.role))}</h3>
                  <p>${escapeHtml(item.company)}</p>
                </div>
                <span>${escapeHtml(text(item.location))}</span>
              </div>
              <h4>Key Responsibilities</h4>
              <ul>
                ${(item.responsibilities || []).map((line) => `<li>${escapeHtml(text(line))}</li>`).join("")}
              </ul>
              <h4>Project Highlight</h4>
              <p>${escapeHtml(text(item.highlight))}</p>
            </div>
          </article>
        `
      )
      .join("");

    $$(".company-logo img").forEach((image) => {
      image.onerror = () => image.classList.add("is-hidden");
    });
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
                  <h3>${escapeHtml(text(item.degree))}</h3>
                  <p>${escapeHtml(item.school)}</p>
                </div>
                <span>${escapeHtml(text(item.location))}</span>
              </div>
              <p>${escapeHtml(text(item.detail))}</p>
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

  function askAssistant(question) {
    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;
    const lower = cleanQuestion.toLowerCase();
    const match = (data.assistant?.answers || []).find((item) =>
      (item.keywords || []).some((keyword) => lower.includes(String(keyword).toLowerCase()))
    );
    state.messages.push({ from: "user", content: cleanQuestion });
    state.messages.push({ from: "assistant", content: text(match?.answer) || text(data.assistant?.fallback) });
    renderAssistant(false);
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
      link.addEventListener("click", async (event) => {
        const href = link.getAttribute("href");
        if (!href || href === "#") {
          event.preventDefault();
          alert(state.language === "zh" ? "请先把 PDF 简历放到 assets/resume.pdf" : "Please add the resume PDF to assets/resume.pdf first.");
          return;
        }
        try {
          const response = await fetch(href, { method: "HEAD" });
          if (!response.ok) {
            event.preventDefault();
            alert(state.language === "zh" ? "简历文件暂未找到，请将 PDF 放到 assets/resume.pdf" : "Resume file was not found. Please place the PDF at assets/resume.pdf.");
          }
        } catch (error) {
          if (location.protocol !== "file:") return;
          event.preventDefault();
          alert(state.language === "zh" ? "本地预览时请确认 assets/resume.pdf 已存在，或把 PDF 文件发给我放入项目。" : "Please make sure assets/resume.pdf exists, or send me the PDF to add it to the project.");
        }
      });
    });

    $$('[data-action="toggle-assistant"]').forEach((button) => {
      button.addEventListener("click", () => {
        state.assistantOpen = !state.assistantOpen;
        renderAssistant(false);
      });
    });

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
