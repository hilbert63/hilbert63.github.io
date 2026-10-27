(() => {
  "use strict";
  const config = window.SITE_CONTENT;
  if (!config?.translations) return;
  const $ = (selector, root = document) => root.querySelector(selector);
  const make = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  };
  const storageKey = "hilbert-homepage-language";
  let language = config.defaultLanguage || "zh";
  try {
    const saved = localStorage.getItem(storageKey);
    if (Object.hasOwn(config.translations, saved)) language = saved;
  } catch { /* The page also works when local storage is unavailable. */ }
  const copy = () => config.translations[language];
  const localize = (value) => typeof value === "string" ? value : value?.[language] || "";
  const safeUrl = (value) => {
    if (!value) return "";
    try {
      const url = new URL(value, window.location.href);
      return ["https:", "http:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  };
  const safeImage = (value) => !value || /^(javascript|data):/i.test(value) ? "" : value;
  const dialog = $("#detail-dialog");
  let detailFactory = null;
  function renderDetail() {
    if (!detailFactory) return;
    const { title, label, text, image, alt, url, hint } = detailFactory();
    $("#dialog-title").textContent = title;
    $("#dialog-label").textContent = label;
    $("#dialog-text").textContent = text;
    $("#dialog-hint").textContent = hint || "";
    $("#dialog-hint").hidden = !hint;
    const imageBox = $("#dialog-image");
    imageBox.replaceChildren();
    imageBox.hidden = !image;
    if (image) {
      const img = make("img");
      img.src = safeImage(image);
      img.alt = alt || copy().projectCover;
      imageBox.append(img);
    }
    const link = $("#dialog-link");
    const destination = safeUrl(url);
    link.hidden = !destination;
    if (destination) {
      link.href = destination;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    } else link.removeAttribute("href");
  }
  function showDetail(factory) {
    detailFactory = factory;
    renderDetail();
    dialog.showModal();
    dialog.scrollTop = 0;
    document.body.classList.add("dialog-open");
  }
  $(".dialog-close", dialog).addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
    detailFactory = null;
  });
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });

  function renderProjects() {
    const projects = $("#project-list");
    projects.replaceChildren();
    (config.projects || []).forEach((project, index) => {
      const button = make("button", "project");
      button.type = "button";
      button.dataset.project = index;
      button.setAttribute("aria-haspopup", "dialog");
      const cover = make("div", "project-cover " + (index % 2 ? "project-cover-silver" : "project-cover-blue"));
      const img = make("img");
      img.src = safeImage(project.image);
      img.alt = localize(project.imageAlt) || localize(project.title);
      img.loading = "lazy"; img.width = 760; img.height = 520;
      cover.append(img);
      if (config.preview) cover.append(make("span", "cover-tag", copy().placeholderCover));
      const arrow = make("span", "project-open", "↗");
      arrow.setAttribute("aria-hidden", "true");
      cover.append(arrow);
      const meta = make("div", "project-meta");
      meta.append(make("span", "", localize(project.category)), make("span", "", localize(project.year)));
      button.append(cover, meta, make("h3", "", localize(project.title)), make("p", "", localize(project.summary)));
      button.addEventListener("click", () => showDetail(() => ({
        title:localize(project.title), label:localize(project.category),
        text:localize(project.detail), image:project.image,
        alt:localize(project.imageAlt), url:project.url,
        hint:config.preview ? copy().projectHint : ""
      })));
      projects.append(button);
    });
    $("#work").hidden = !config.projects?.length;
    document.querySelectorAll('a[href="#work"]').forEach(link => { link.hidden = !config.projects?.length; });
  }

  function renderArticles() {
    const articles = $("#article-list");
    articles.replaceChildren();
    (config.articles || []).forEach((article, index) => {
      const button = make("button", "article");
      button.type = "button"; button.dataset.article = index;
      button.setAttribute("aria-haspopup", "dialog");
      const content = make("span", "article-content");
      content.append(make("span", "article-title", localize(article.title)), make("span", "article-summary", localize(article.summary)));
      const arrow = make("span", "article-arrow", "↗");
      arrow.setAttribute("aria-hidden", "true");
      button.append(make("span", "article-category", localize(article.category)), content, make("span", "article-date", localize(article.date)), arrow);
      button.addEventListener("click", () => showDetail(() => ({
        title:localize(article.title),
        label:localize(article.category) + " / " + localize(article.date),
        text:localize(article.body) || localize(article.summary),
        url:article.url, hint:config.preview ? copy().articleHint : ""
      })));
      articles.append(button);
    });
    $("#writing").hidden = !config.articles?.length;
    document.querySelectorAll('a[href="#writing"]').forEach(link => { link.hidden = !config.articles?.length; });
  }

  function renderSocials() {
    const socialList = $("#social-list");
    socialList.replaceChildren();
    (config.socials || []).forEach((social, index) => {
      const url = safeUrl(social.url);
      const element = make(url ? "a" : "button", "", localize(social.label));
      element.dataset.social = index;
      if (url) {
        element.href = url; element.target = "_blank"; element.rel = "noopener noreferrer";
      } else {
        element.type = "button";
        element.addEventListener("click", () => showDetail(() => ({
          title:localize(social.label), label:copy().contactDetails,
          text:config.preview ? copy().socialPlaceholder.replace("{label}", localize(social.label)) : copy().socialUnavailable
        })));
      }
      const arrow = make("span", "", "↗");
      arrow.setAttribute("aria-hidden", "true");
      element.append(arrow); socialList.append(element);
    });
  }

  function renderLanguage(nextLanguage, announce = false) {
    if (!Object.hasOwn(config.translations, nextLanguage)) return;
    language = nextLanguage;
    const t = copy();
    document.documentElement.lang = t.htmlLang;
    document.title = t.pageTitle;
    $('meta[name="description"]').content = t.pageDescription;
    document.querySelectorAll("[data-i18n]").forEach(node => {
      node.textContent = t[node.dataset.i18n] || "";
    });
    $('[data-i18n="secondaryName"]').hidden = !t.secondaryName;
    document.querySelectorAll("[data-i18n-aria]").forEach(node => {
      node.setAttribute("aria-label", t[node.dataset.i18nAria]);
    });
    document.querySelectorAll("[data-i18n-alt]").forEach(node => {
      node.setAttribute("alt", t[node.dataset.i18nAlt]);
    });
    document.querySelectorAll("[data-language]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.language === language));
    });
    document.querySelectorAll("[data-preview]").forEach(node => { node.hidden = !config.preview; });
    $("#email-label").textContent = config.email || t.emailPlaceholder;
    renderProjects();
    renderArticles();
    renderSocials();
    if (dialog.open) renderDetail();
    if (announce) {
      $("#language-status").textContent = t.languageChanged;
      try { localStorage.setItem(storageKey, language); } catch { /* Optional preference storage. */ }
    }
  }
  document.querySelectorAll("[data-language]").forEach(button => {
    button.addEventListener("click", () => renderLanguage(button.dataset.language, true));
  });
  $("#year").textContent = new Date().getFullYear();
  $("#dismiss-notice").addEventListener("click", () => { $(".preview-notice").hidden = true; });
  $("#email-button").addEventListener("click", () => {
    const email = (config.email || "").trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      window.location.href = "mailto:" + encodeURIComponent(email);
    } else {
      showDetail(() => ({
        title:copy().contactTitle, label:copy().contactMe,
        text:config.preview ? copy().emailPreview : copy().emailUnavailable
      }));
    }
  });
  renderLanguage(language);
})();
