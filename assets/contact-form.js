(function () {
  "use strict";

  const CONFIG = Object.freeze({
    templateUrl: "/assets/contact-form.html",
    endpoint: "https://formspree.io/f/mpzbwnop",
    successCloseDelayMs: 1800,
  });

  const TYPE_LABELS = Object.freeze({
    bug: "گزارش مشکل",
    feature: "پیشنهاد ویژگی",
    question: "سوال",
    feedback: "بازخورد",
    other: "سایر موارد",
  });

  const MESSAGES = Object.freeze({
    success: "پیام شما با موفقیت ارسال شد! به زودی با شما تماس می‌گیریم.",
    error: "خطا در ارسال پیام. لطفاً دوباره تلاش کنید.",
  });

  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]), select:not([disabled])';

  class ContactDialog {
    #openButton;
    #root;
    #form;
    #submitButton;
    #messageBox;
    #counter;
    #previouslyFocused = null;
    #closeTimer = 0;
    #ready;

    constructor(openButton) {
      this.#openButton = openButton;
    }

    init() {
      this.#openButton.addEventListener("click", () => this.open());
      this.#ready = this.#loadTemplate();
      const schedule =
        window.requestIdleCallback ?? ((cb) => setTimeout(cb, 200));
      schedule(() => this.#ready);
    }

    async open() {
      if (!(await this.#ready)) return;

      clearTimeout(this.#closeTimer);
      this.#previouslyFocused = document.activeElement;
      this.#root.classList.remove("hidden");
      document.documentElement.classList.add("cf-modal-open");
      this.#root
        .querySelector('input[name="type"]:checked, #contactName')
        ?.focus();
    }

    close({ reset = false } = {}) {
      clearTimeout(this.#closeTimer);
      this.#root.classList.add("hidden");
      document.documentElement.classList.remove("cf-modal-open");
      this.#hideMessage();

      if (reset) this.#resetForm();

      this.#previouslyFocused?.focus?.();
      this.#previouslyFocused = null;
    }

    async #loadTemplate() {
      try {
        const response = await fetch(CONFIG.templateUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        document.body.insertAdjacentHTML("beforeend", await response.text());
        this.#cacheElements();
        this.#bindEvents();
        return true;
      } catch (error) {
        console.error("Error loading contact form:", error);
        return false;
      }
    }

    #cacheElements() {
      this.#root = document.getElementById("contactModal");
      this.#form = document.getElementById("contactForm");
      this.#submitButton = this.#form.querySelector(".btn-submit");
      this.#messageBox = document.getElementById("formMessage");
      this.#counter = document.getElementById("contactCounter");
    }

    #bindEvents() {
      const close = () => this.close();

      document
        .getElementById("closeContactModal")
        .addEventListener("click", close);
      document
        .getElementById("cancelContactForm")
        .addEventListener("click", close);
      this.#root
        .querySelector(".contact-modal-overlay")
        .addEventListener("click", close);

      this.#form.addEventListener("submit", (e) => this.#handleSubmit(e));
      this.#form.addEventListener("input", (e) => {
        if (e.target.name === "message") this.#updateCounter();
      });

      document.addEventListener("keydown", (e) => this.#handleKeydown(e));
    }

    #handleKeydown(event) {
      if (this.#root.classList.contains("hidden")) return;

      if (event.key === "Escape") {
        this.close();
        return;
      }

      if (event.key === "Tab") this.#trapFocus(event);
    }

    #trapFocus(event) {
      const items = [...this.#root.querySelectorAll(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    async #handleSubmit(event) {
      event.preventDefault();
      this.#form.classList.add("was-validated");

      if (!this.#form.checkValidity()) {
        this.#form.querySelector(":invalid")?.focus();
        return;
      }

      this.#setBusy(true);
      this.#hideMessage();

      try {
        await this.#send(new FormData(this.#form));
        this.#showMessage(MESSAGES.success, "success");
        this.#closeTimer = setTimeout(
          () => this.close({ reset: true }),
          CONFIG.successCloseDelayMs,
        );
      } catch (error) {
        console.error("Contact form submit failed:", error);
        this.#showMessage(MESSAGES.error, "error");
      } finally {
        this.#setBusy(false);
      }
    }

    async #send(formData) {
      const label = TYPE_LABELS[formData.get("type")] ?? formData.get("type");
      formData.append("subject", `پیام جدید از صفحه اصلی - ${label}`);
      formData.append("_page", window.location.href);

      const response = await fetch(CONFIG.endpoint, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (!response.ok)
        throw new Error(`Formspree responded with ${response.status}`);
    }

    #setBusy(isBusy) {
      this.#submitButton.disabled = isBusy;
      this.#submitButton.setAttribute("aria-busy", String(isBusy));
    }

    #showMessage(text, type) {
      this.#messageBox.textContent = text;
      this.#messageBox.className = `form-message ${type}`;
    }

    #hideMessage() {
      this.#messageBox.className = "form-message hidden";
      this.#messageBox.textContent = "";
    }

    #resetForm() {
      this.#form.reset();
      this.#form.classList.remove("was-validated");
      this.#updateCounter();
    }

    #updateCounter() {
      const textarea = this.#form.elements.message;
      this.#counter.textContent = `${textarea.value.length} / ${textarea.maxLength}`;
    }
  }

  const openButton = document.getElementById("openContactBtn");
  if (openButton) new ContactDialog(openButton).init();
})();
