(function () {
  "use strict";

  const CONFIG = Object.freeze({
    homeUrl: "/",
    emailServiceUrl: "https://formspree.io/f/mpzbwnop",
    toolName: document.title || "ابزار",
  });

  const ICONS = Object.freeze({
    back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="3"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
  });

  const STORAGE_KEYS = Object.freeze({ theme: "theme", lang: "lang" });

  class ToolWrapper {
    #wrapper;
    #modal;
    #contactButton;
    #previouslyFocused = null;
    #toastTimer = null;

    static #escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML.replace(/"/g, "&quot;");
    }

    static #systemTheme() {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    static #icon(name, className = "") {
      const cls = className ? ` class="${className}"` : "";
      return `<svg${cls} viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
    }

    init() {
      this.#injectWrapper();
      this.#injectModal();
      this.#bindEvents();
      document.body.classList.add("has-tool-wrapper");
      this.#applyStoredPreferences();
      this.#watchThemeFromOtherTabs();
      this.#ensurePwaUpdater();
    }

    openContactModal() {
      this.#previouslyFocused = document.activeElement;
      this.#modal.classList.add("active");
      document.documentElement.classList.add("tw-modal-open");
      this.#modal.querySelector("#contactName")?.focus();
    }

    closeContactModal() {
      this.#modal.classList.remove("active");
      document.documentElement.classList.remove("tw-modal-open");
      this.#previouslyFocused?.focus?.();
      this.#previouslyFocused = null;
    }

    toggleTheme() {
      const next = this.getCurrentTheme() === "light" ? "dark" : "light";
      localStorage.setItem(STORAGE_KEYS.theme, next);
      this.#applyTheme(next);
      window.dispatchEvent(new CustomEvent("themeChanged", { detail: next }));
    }

    toggleLanguage() {
      const next = this.getCurrentLanguage() === "fa" ? "en" : "fa";
      localStorage.setItem(STORAGE_KEYS.lang, next);
      this.#applyLanguage(next);
      window.dispatchEvent(
        new CustomEvent("languageChanged", { detail: next }),
      );
    }

    getCurrentTheme() {
      const stored = localStorage.getItem(STORAGE_KEYS.theme);
      return stored === "dark" || stored === "light"
        ? stored
        : ToolWrapper.#systemTheme();
    }

    getCurrentLanguage() {
      return localStorage.getItem(STORAGE_KEYS.lang) || "fa";
    }

    showToast(message) {
      let toast = document.getElementById("toolToast");
      if (!toast) {
        toast = document.createElement("div");
        toast.id = "toolToast";
        toast.className = "tool-toast";
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.classList.add("show");
      if (this.#toastTimer) clearTimeout(this.#toastTimer);
      this.#toastTimer = setTimeout(() => {
        toast.classList.remove("show");
      }, 2500);
    }

    #ensurePwaUpdater() {
      if ("serviceWorker" in navigator && !window.__appUpdaterLoaded) {
        window.__appUpdaterLoaded = true;
        const script = document.createElement("script");
        script.src = "/app-updater.js";
        script.defer = true;
        document.head.appendChild(script);
      }
    }

    #injectWrapper() {
      const name = ToolWrapper.#escapeHtml(CONFIG.toolName);
      this.#wrapper = document.createElement("div");
      this.#wrapper.className = "tool-wrapper";
      this.#wrapper.innerHTML = `
                <div class="tool-header">
                    <a href="${CONFIG.homeUrl}" class="tool-back-btn" id="toolBackBtn" title="بازگشت به خانه" aria-label="بازگشت به خانه">
                        ${ToolWrapper.#icon("back")}
                        <span class="tool-back-text">خانه</span>
                    </a>
                    <div class="tool-header-center">
                        <span class="tool-title-dot" aria-hidden="true"></span>
                        <h1 class="tool-header-title" title="${name}">${name}</h1>
                    </div>
                    <div class="tool-header-actions">
                        <button type="button" class="tool-action-btn tool-share-btn" id="toolShareBtn" title="اشتراک‌گذاری و کپی لینک" aria-label="کپی لینک">
                            ${ToolWrapper.#icon("share")}
                        </button>
                        <button type="button" class="tool-action-btn tool-theme-btn" id="toolThemeBtn" title="تغییر تم" aria-label="تغییر تم">
                            ${ToolWrapper.#icon("moon", "icon-moon")}${ToolWrapper.#icon("sun", "icon-sun")}
                        </button>
                        <button type="button" class="tool-action-btn tool-contact-btn" id="toolContactBtn" title="تماس با ما / گزارش مشکل" aria-label="تماس با ما">
                            ${ToolWrapper.#icon("mail")}
                        </button>
                    </div>
                </div>`;
      document.body.insertBefore(this.#wrapper, document.body.firstChild);
      this.#contactButton = this.#wrapper.querySelector("#toolContactBtn");
    }

    #injectModal() {
      const name = ToolWrapper.#escapeHtml(CONFIG.toolName);
      const page = ToolWrapper.#escapeHtml(window.location.href);
      this.#modal = document.createElement("div");
      this.#modal.className = "contact-modal";
      this.#modal.id = "contactModal";
      this.#modal.setAttribute("role", "dialog");
      this.#modal.setAttribute("aria-modal", "true");
      this.#modal.setAttribute("aria-labelledby", "contactModalTitle");
      this.#modal.innerHTML = `
                <div class="contact-modal-content">
                    <div class="contact-modal-header">
                        <h2 class="contact-modal-title" id="contactModalTitle">تماس با ما / گزارش مشکل</h2>
                        <button type="button" class="contact-modal-close" id="contactModalClose" aria-label="Close">
                            ${ToolWrapper.#icon("close")}
                        </button>
                    </div>
                    <form id="contactForm" class="contact-form">
                        <div class="contact-form-group">
                            <label class="contact-form-label" for="contactName">نام *</label>
                            <input type="text" id="contactName" name="name" class="contact-form-input" autocomplete="name" required>
                        </div>
                        <div class="contact-form-group">
                            <label class="contact-form-label" for="contactEmail">ایمیل *</label>
                            <input type="email" id="contactEmail" name="email" class="contact-form-input" autocomplete="email" required>
                        </div>
                        <div class="contact-form-group">
                            <label class="contact-form-label" for="contactSubject">موضوع *</label>
                            <input type="text" id="contactSubject" name="subject" class="contact-form-input" required>
                        </div>
                        <div class="contact-form-group">
                            <label class="contact-form-label" for="contactMessage">پیام / گزارش مشکل *</label>
                            <textarea id="contactMessage" name="message" class="contact-form-textarea" required></textarea>
                        </div>
                        <input type="hidden" name="_subject" value="پیام جدید از ${name}">
                        <input type="hidden" name="_tool" value="${name}">
                        <input type="hidden" name="_page" value="${page}">
                        <button type="submit" class="contact-form-submit" id="contactFormSubmit">ارسال پیام</button>
                        <div id="contactFormMessage" class="contact-form-message" role="status" style="display: none;"></div>
                    </form>
                </div>`;
      document.body.appendChild(this.#modal);
    }

    #bindEvents() {
      this.#wrapper
        .querySelector("#toolBackBtn")
        .addEventListener("click", (e) => {
          if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
            e.preventDefault();
            window.location.href = CONFIG.homeUrl;
          }
        });

      this.#wrapper
        .querySelector("#toolShareBtn")
        ?.addEventListener("click", async () => {
          const shareData = {
            title: document.title,
            text: document.title,
            url: window.location.href,
          };
          if (navigator.share) {
            try {
              await navigator.share(shareData);
              return;
            } catch (err) {
              if (err.name === "AbortError") return;
            }
          }
          try {
            await navigator.clipboard.writeText(window.location.href);
            this.showToast("لینک این ابزار کپی شد ✨");
          } catch {
            this.showToast(window.location.href);
          }
        });

      this.#wrapper
        .querySelector("#toolThemeBtn")
        .addEventListener("click", () => this.toggleTheme());
      this.#contactButton.addEventListener("click", () =>
        this.openContactModal(),
      );

      this.#modal
        .querySelector("#contactModalClose")
        .addEventListener("click", () => this.closeContactModal());
      this.#modal.addEventListener("click", (e) => {
        if (e.target === this.#modal) this.closeContactModal();
      });
      this.#modal
        .querySelector("#contactForm")
        .addEventListener("submit", (e) => this.#handleSubmit(e));

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.#modal.classList.contains("active")) {
          this.closeContactModal();
        }
      });
    }

    async #handleSubmit(e) {
      e.preventDefault();

      const form = e.target;
      const submitButton = this.#modal.querySelector("#contactFormSubmit");
      const messageBox = this.#modal.querySelector("#contactFormMessage");

      submitButton.disabled = true;
      submitButton.textContent = "در حال ارسال...";
      messageBox.style.display = "none";

      try {
        const response = await fetch(CONFIG.emailServiceUrl, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });

        if (!response.ok) throw new Error("خطا در ارسال پیام");

        this.#showMessage(
          messageBox,
          "success",
          "پیام شما با موفقیت ارسال شد. به زودی با شما تماس می‌گیریم.",
        );
        form.reset();
        setTimeout(() => {
          this.closeContactModal();
          messageBox.style.display = "none";
        }, 2000);
      } catch {
        this.#showMessage(
          messageBox,
          "error",
          "خطا در ارسال پیام. لطفاً دوباره تلاش کنید.",
        );
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "ارسال پیام";
      }
    }

    #showMessage(box, type, text) {
      box.textContent = text;
      box.className = `contact-form-message ${type}`;
      box.style.display = "block";
    }

    #applyStoredPreferences() {
      const hadStoredTheme = localStorage.getItem(STORAGE_KEYS.theme) !== null;
      const theme = this.getCurrentTheme();

      this.#applyTheme(theme);
      this.#applyLanguage(this.getCurrentLanguage());

      if (!hadStoredTheme) {
        // First visit: keep every page and tool on the same effective theme
        localStorage.setItem(STORAGE_KEYS.theme, theme);
        window.dispatchEvent(
          new CustomEvent("themeChanged", { detail: theme }),
        );
      }
    }

    #applyTheme(theme) {
      const isDark = theme === "dark";
      document.documentElement.setAttribute("data-theme", theme);
      document.body.setAttribute("data-theme", theme);
      this.#wrapper.classList.toggle("dark-mode", isDark);
      this.#modal.classList.toggle("dark-mode", isDark);
      this.#wrapper
        .querySelector("#toolThemeBtn")
        .setAttribute("aria-pressed", String(isDark));
    }

    #applyLanguage(lang) {
      const isFa = lang === "fa";
      const html = document.documentElement;
      html.setAttribute("lang", lang);
      html.setAttribute("dir", isFa ? "rtl" : "ltr");
      document.body.style.direction = isFa ? "rtl" : "ltr";
      const label = this.#wrapper.querySelector("#toolLangText");
      if (label) label.textContent = isFa ? "EN" : "FA";
    }

    #watchThemeFromOtherTabs() {
      window.addEventListener("storage", (e) => {
        if (e.key !== STORAGE_KEYS.theme) return;
        if (e.newValue === "dark" || e.newValue === "light") {
          this.#applyTheme(e.newValue);
        }
      });
    }
  }

  function bootstrap() {
    const instance = new ToolWrapper();
    instance.init();

    window.ToolWrapper = Object.freeze({
      openContactModal: () => instance.openContactModal(),
      closeContactModal: () => instance.closeContactModal(),
      toggleTheme: () => instance.toggleTheme(),
      toggleLanguage: () => instance.toggleLanguage(),
      getCurrentTheme: () => instance.getCurrentTheme(),
      getCurrentLanguage: () => instance.getCurrentLanguage(),
      showToast: (msg) => instance.showToast(msg),
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
