(function () {
  "use strict";

  const CONFIG = Object.freeze({
    homeUrl: "/",
    emailServiceUrl: "https://formspree.io/f/mpzbwnop",
    toolName: document.title || "ابزار",
  });

  const ICONS = Object.freeze({
    back: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3.5 7 8.5 6 8.5-6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
  });

  const STORAGE_KEYS = Object.freeze({ theme: "theme", lang: "lang" });

  class ToolWrapper {
    #wrapper;
    #modal;
    #contactButton;
    #previouslyFocused = null;

    static #escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML.replace(/"/g, "&quot;");
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
      return localStorage.getItem(STORAGE_KEYS.theme) || "light";
    }

    getCurrentLanguage() {
      return localStorage.getItem(STORAGE_KEYS.lang) || "fa";
    }

    #injectWrapper() {
      const name = ToolWrapper.#escapeHtml(CONFIG.toolName);
      this.#wrapper = document.createElement("div");
      this.#wrapper.className = "tool-wrapper";
      this.#wrapper.innerHTML = `
                <div class="tool-header">
                    <button type="button" class="tool-back-btn" id="toolBackBtn" title="بازگشت به صفحه اصلی" aria-label="Back to home">
                        ${ToolWrapper.#icon("back")}
                    </button>
                    <h1 class="tool-header-title">${name}</h1>
                    <div class="tool-header-actions">
                        <button type="button" class="tool-theme-btn" id="toolThemeBtn" title="تغییر تم" aria-label="Toggle theme">
                            ${ToolWrapper.#icon("moon", "icon-moon")}${ToolWrapper.#icon("sun", "icon-sun")}
                        </button>
                        <button type="button" class="tool-contact-btn" id="toolContactBtn" title="تماس با ما / گزارش مشکل" aria-label="Contact us">
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
        .addEventListener("click", () => {
          window.location.href = CONFIG.homeUrl;
        });
      this.#wrapper
        .querySelector("#toolThemeBtn")
        .addEventListener("click", () => this.toggleTheme());
      this.#wrapper
        .querySelector("#toolLangBtn")
        .addEventListener("click", () => this.toggleLanguage());
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
      this.#applyTheme(this.getCurrentTheme());
      this.#applyLanguage(this.getCurrentLanguage());
    }

    #applyTheme(theme) {
      const isDark = theme === "dark";
      document.documentElement.setAttribute("data-theme", theme);
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
      this.#wrapper.querySelector("#toolLangText").textContent = isFa
        ? "EN"
        : "FA";
    }

    #watchThemeFromOtherTabs() {
      window.addEventListener("storage", (e) => {
        if (e.key !== STORAGE_KEYS.theme) return;
        const isDark = e.newValue === "dark";
        this.#wrapper.classList.toggle("dark-mode", isDark);
        this.#modal.classList.toggle("dark-mode", isDark);
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
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
