This file is a merged representation of the entire codebase, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
fonts/
  webfonts/
    Vazirmatn-Black.woff2
    Vazirmatn-Bold.woff2
    Vazirmatn-ExtraBold.woff2
    Vazirmatn-ExtraLight.woff2
    Vazirmatn-Light.woff2
    Vazirmatn-Medium.woff2
    Vazirmatn-Regular.woff2
    Vazirmatn-SemiBold.woff2
    Vazirmatn-Thin.woff2
    Vazirmatn[wght].woff2
icons/
  app/
    01.png
    02.png
    03.png
    04.png
    05.png
    06.png
    07.png
    08.png
    09.png
    10.png
    11.png
    12.png
    13.png
    14.png
    15.png
    16.png
    17.png
    18.png
    19.png
    20.png
    21.png
    22.png
    23.png
    24.png
    25.png
    26.png
    27.png
    28.png
    29.png
  game/
    01.png
    02.png
  sites/
    01.png
    02.png
    03.png
    04.png
    05.png
    06.png
    07.png
    08.png
    09.png
    10.png
    11.png
    12.png
    13.png
    14.png
    15.png
    16.png
    17.png
    18.png
    19.png
    20.png
    21.png
    22.png
    23.png
    24.png
    25.png
    26.png
    27.png
    28.png
    29.png
    30.png
    31.png
  launchericon-144x144.png
  launchericon-192x192.png
  launchericon-48x48.png
  launchericon-512x512-maskable.png
  launchericon-512x512.png
  launchericon-72x72.png
  launchericon-96x96.png
screenshots/
  01.jpg
  02.jpg
  03.jpg
  04.jpg
contact-form.css
contact-form.html
contact-form.js
tool-wrapper.css
tool-wrapper.js
tools.css
```

# Files

## File: contact-form.css
```css
/* Contact dialog (home page). Uses the theme variables from style.css. */

.contact-modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.contact-modal.hidden {
  display: none;
}

html.cf-modal-open {
  overflow: hidden;
}

.contact-modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(8, 12, 28, 0.6);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  animation: cf-fade-in 0.2s ease;
}

.contact-modal-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 560px;
  max-height: min(92dvh, 760px);
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--bg1);
  border: 1px solid var(--border);
  border-radius: 24px;
  box-shadow: var(--shadow);
  animation: cf-pop 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.contact-modal-handle {
  display: none;
}

/* Header */
.contact-modal-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px 24px 18px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(
    135deg,
    rgba(124, 92, 255, 0.14),
    rgba(46, 233, 166, 0.06)
  );
}

.contact-modal-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  color: #fff;
  box-shadow: 0 8px 20px rgba(124, 92, 255, 0.35);
}

.contact-modal-badge svg,
.contact-modal-close svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.contact-modal-heading {
  flex: 1;
  min-width: 0;
}

.contact-modal-heading h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
}

.contact-modal-heading p {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--muted);
}

.contact-modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: var(--card);
  color: var(--muted);
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.contact-modal-close svg {
  width: 20px;
  height: 20px;
}

.contact-modal-close:hover {
  background: rgba(124, 92, 255, 0.16);
  color: var(--text);
}

/* Form */
.contact-form {
  padding: 22px 24px 24px;
}

.type-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
  margin: 0 0 20px;
  padding: 0;
  border: 0;
}

.type-picker legend {
  float: inline-start;
  width: 100%;
  margin-bottom: 10px;
  padding: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}

.type-chip {
  position: relative;
  cursor: pointer;
}

.type-chip input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.type-chip span {
  display: inline-block;
  padding: 8px 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--card);
  color: var(--muted);
  font-size: 14px;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.type-chip:hover span {
  border-color: rgba(124, 92, 255, 0.45);
  color: var(--text);
}

.type-chip input:checked + span {
  border-color: var(--accent);
  background: rgba(124, 92, 255, 0.2);
  color: var(--text);
  font-weight: 600;
}

.type-chip input:focus-visible + span {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.form-group {
  position: relative;
  min-width: 0;
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text);
  font-family:
    "Vazirmatn",
    system-ui,
    -apple-system,
    "Segoe UI",
    Roboto,
    Arial,
    sans-serif;
  font-size: 16px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: var(--muted);
  opacity: 0.7;
}

.form-group input[type="email"] {
  text-align: left;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent);
  background: rgba(124, 92, 255, 0.08);
  box-shadow: 0 0 0 4px rgba(124, 92, 255, 0.18);
}

.contact-form.was-validated :is(input, textarea):invalid {
  border-color: #ff5252;
}

.contact-form.was-validated .type-picker:has(input:invalid) .type-chip span {
  border-color: rgba(255, 82, 82, 0.6);
}

.form-group textarea {
  min-height: 120px;
  resize: vertical;
}

.char-counter {
  position: absolute;
  inset-inline-end: 12px;
  bottom: 10px;
  font-size: 12px;
  color: var(--muted);
  pointer-events: none;
}

/* Honeypot: hidden from people, visible to naive bots */
.contact-hp {
  position: absolute;
  inset-inline-start: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

/* Actions */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 6px;
}

.btn-submit,
.btn-cancel {
  flex: 1;
  min-height: 48px;
  padding: 12px 24px;
  border: 0;
  border-radius: 14px;
  font-family:
    "Vazirmatn",
    system-ui,
    -apple-system,
    "Segoe UI",
    Roboto,
    Arial,
    sans-serif;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease,
    opacity 0.2s ease;
}

.btn-submit {
  flex: 2;
  background: linear-gradient(
    135deg,
    var(--accent),
    #5a8cff 55%,
    var(--accent2)
  );
  color: #fff;
  box-shadow: 0 8px 24px rgba(124, 92, 255, 0.3);
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(124, 92, 255, 0.4);
}

.btn-submit:active:not(:disabled) {
  transform: translateY(0);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-cancel {
  background: var(--card);
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-cancel:hover {
  background: rgba(124, 92, 255, 0.12);
}

.btn-submit:focus-visible,
.btn-cancel:focus-visible,
.contact-modal-close:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.btn-loading {
  display: none;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-submit[aria-busy="true"] .btn-text {
  display: none;
}

.btn-submit[aria-busy="true"] .btn-loading {
  display: inline-flex;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: cf-spin 0.7s linear infinite;
}

.form-message {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  text-align: center;
}

.form-message.success {
  background: rgba(46, 233, 166, 0.15);
  color: var(--accent2);
  border: 1px solid rgba(46, 233, 166, 0.3);
}

body[data-theme="light"] .form-message.success {
  color: #0c8f64;
}

.form-message.error {
  background: rgba(255, 82, 82, 0.12);
  color: #ff6b6b;
  border: 1px solid rgba(255, 82, 82, 0.3);
}

body[data-theme="light"] .form-message.error {
  color: #d62f2f;
}

/* Header contact button: same look as the theme toggle */
.header-contact-btn {
  width: 48px;
  height: 48px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text);
  font-size: 22px;
  cursor: pointer;
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
}

.header-contact-btn:hover {
  background: rgba(124, 92, 255, 0.12);
  border-color: rgba(124, 92, 255, 0.35);
  transform: scale(1.05);
}

.header-contact-btn:active {
  transform: scale(0.95);
}

@keyframes cf-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes cf-pop {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes cf-sheet-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes cf-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Mobile: bottom sheet */
@media (max-width: 640px) {
  .contact-modal {
    align-items: flex-end;
    padding: 0;
  }

  .contact-modal-content {
    max-width: none;
    max-height: 94dvh;
    border-width: 1px 0 0;
    border-radius: 24px 24px 0 0;
    animation: cf-sheet-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .contact-modal-handle {
    display: block;
    width: 40px;
    height: 4px;
    margin: 10px auto 0;
    border-radius: 2px;
    background: var(--border);
  }

  .contact-modal-header {
    padding: 14px 20px 16px;
  }

  .contact-form {
    padding: 20px 20px max(24px, env(safe-area-inset-bottom));
  }

  .form-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
  }

  .form-actions {
    flex-direction: column-reverse;
  }
}

@media (max-width: 768px) {
  .header-contact-btn {
    width: 44px;
    height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .contact-modal-overlay,
  .contact-modal-content,
  .spinner {
    animation: none;
  }

  .btn-submit,
  .btn-cancel,
  .header-contact-btn,
  .type-chip span {
    transition: none;
  }
}
```

## File: contact-form.html
```html
<!-- Contact dialog (loaded by contact-form.js) -->
<div id="contactModal" class="contact-modal hidden" role="dialog" aria-modal="true" aria-labelledby="contactModalTitle">
    <div class="contact-modal-overlay"></div>

    <div class="contact-modal-content">
        <div class="contact-modal-handle" aria-hidden="true"></div>

        <div class="contact-modal-header">
            <span class="contact-modal-badge" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                    <rect x="3" y="5" width="18" height="14" rx="3" />
                    <path d="m3.5 7 8.5 6 8.5-6" />
                </svg>
            </span>
            <div class="contact-modal-heading">
                <h2 id="contactModalTitle">تماس با ما / گزارش مشکل</h2>
                <p>نوع پیام را انتخاب کنید و توضیح دهید.</p>
            </div>
            <button type="button" class="contact-modal-close" id="closeContactModal" aria-label="بستن">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M6 6l12 12M18 6 6 18" />
                </svg>
            </button>
        </div>

        <form id="contactForm" class="contact-form" novalidate>
            <fieldset class="type-picker">
                <legend>نوع پیام</legend>
                <label class="type-chip">
                    <input type="radio" name="type" value="bug" required>
                    <span>🐛 گزارش مشکل</span>
                </label>
                <label class="type-chip">
                    <input type="radio" name="type" value="feature">
                    <span>💡 پیشنهاد ویژگی</span>
                </label>
                <label class="type-chip">
                    <input type="radio" name="type" value="question">
                    <span>❓ سوال</span>
                </label>
                <label class="type-chip">
                    <input type="radio" name="type" value="feedback">
                    <span>💬 بازخورد</span>
                </label>
                <label class="type-chip">
                    <input type="radio" name="type" value="other">
                    <span>📝 سایر</span>
                </label>
            </fieldset>

            <div class="form-row">
                <div class="form-group">
                    <label for="contactName">نام و نام خانوادگی</label>
                    <input type="text" id="contactName" name="name" required autocomplete="name"
                        placeholder="نام خود را وارد کنید">
                </div>
                <div class="form-group">
                    <label for="contactEmail">ایمیل</label>
                    <input type="email" id="contactEmail" name="email" required autocomplete="email" dir="ltr"
                        placeholder="example@email.com">
                </div>
            </div>

            <div class="form-group">
                <label for="contactMessage">پیام</label>
                <textarea id="contactMessage" name="message" required rows="5" maxlength="2000"
                    placeholder="پیام خود را بنویسید..."></textarea>
                <span class="char-counter" id="contactCounter" aria-hidden="true">0 / 2000</span>
            </div>

            <div class="contact-hp" aria-hidden="true">
                <label>Leave this field empty<input type="text" name="_gotcha" tabindex="-1" autocomplete="off"></label>
            </div>

            <div class="form-actions">
                <button type="submit" class="btn-submit">
                    <span class="btn-text">ارسال پیام</span>
                    <span class="btn-loading"><span class="spinner" aria-hidden="true"></span>در حال ارسال...</span>
                </button>
                <button type="button" class="btn-cancel" id="cancelContactForm">انصراف</button>
            </div>

            <div id="formMessage" class="form-message hidden" role="status" aria-live="polite"></div>
        </form>
    </div>
</div>
```

## File: contact-form.js
```javascript
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
```

## File: tool-wrapper.css
```css
:root {
    --tw-height: 52px;
    --tw-offset: calc(var(--tw-height) + env(safe-area-inset-top, 0px));
}

.tool-wrapper,
.contact-modal {
  --tw-accent: #7c5cff;
  --tw-accent-2: #2ee9a6;
  --tw-fg: #0b1020;
  --tw-muted: rgba(11, 16, 32, 0.62);
  --tw-bar-bg: rgba(255, 255, 255, 0.78);
  --tw-surface: rgba(124, 92, 255, 0.1);
  --tw-surface-hover: rgba(124, 92, 255, 0.18);
  --tw-surface-solid: #ffffff;
  --tw-field: rgba(11, 16, 32, 0.035);
  --tw-border: rgba(11, 16, 32, 0.1);
  --tw-ok: #0c8f64;
  --tw-error: #d62f2f;
  font-family:
    "Vazirmatn",
    system-ui,
    -apple-system,
    "Segoe UI",
    Roboto,
    sans-serif;
}

.tool-wrapper.dark-mode,
.contact-modal.dark-mode {
  --tw-fg: rgba(255, 255, 255, 0.92);
  --tw-muted: rgba(255, 255, 255, 0.68);
  --tw-bar-bg: rgba(15, 23, 48, 0.78);
  --tw-surface: rgba(124, 92, 255, 0.2);
  --tw-surface-hover: rgba(124, 92, 255, 0.32);
  --tw-surface-solid: #131c3a;
  --tw-field: rgba(255, 255, 255, 0.06);
  --tw-border: rgba(255, 255, 255, 0.14);
  --tw-ok: #2ee9a6;
  --tw-error: #ff7a7a;
}

html {
    padding-top: var(--tw-offset);
    scroll-padding-top: var(--tw-offset);
}

body.has-tool-wrapper {
    box-sizing: border-box;
}

.tool-wrapper {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 9999;
  padding-top: env(safe-area-inset-top);
  background: var(--tw-bar-bg);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  backdrop-filter: blur(16px) saturate(180%);
  box-sizing: border-box;
  box-shadow: 0 1px 0 var(--tw-border);
  color: var(--tw-fg);
}

.tool-wrapper::after {
  content: "";
  position: absolute;
  inset: auto 0 -1px 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--tw-accent),
    var(--tw-accent-2),
    transparent
  );
  opacity: 0.55;
  pointer-events: none;
}

[dir="rtl"] .tool-wrapper {
  direction: rtl;
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 8px;
  height: var(--tw-height);
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: max(12px, env(safe-area-inset-left))
    max(12px, env(safe-area-inset-right));
}

.tool-header-title {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--tw-fg);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tool-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

/* Shared icon-button style */
.tool-back-btn,
.tool-theme-btn,
.tool-lang-btn,
.tool-contact-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 12px;
  background: var(--tw-surface);
  color: var(--tw-accent);
  font: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.15s ease;
}

.tool-back-btn {
  order: -1;
}

.tool-contact-btn {
  order: 1;
  background: rgba(46, 233, 166, 0.14);
  color: var(--tw-ok);
}

.tool-lang-btn {
  padding-inline: 12px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.tool-back-btn svg,
.tool-theme-btn svg,
.tool-contact-btn svg,
.contact-modal-close svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.tool-back-btn:hover,
.tool-theme-btn:hover,
.tool-lang-btn:hover {
  background: var(--tw-surface-hover);
  border-color: rgba(124, 92, 255, 0.35);
}

.tool-contact-btn:hover {
  background: rgba(46, 233, 166, 0.24);
  border-color: rgba(46, 233, 166, 0.45);
}

.tool-back-btn:active,
.tool-theme-btn:active,
.tool-lang-btn:active,
.tool-contact-btn:active {
  transform: scale(0.94);
}

.tool-back-btn:focus-visible,
.tool-theme-btn:focus-visible,
.tool-lang-btn:focus-visible,
.tool-contact-btn:focus-visible,
.contact-modal-close:focus-visible,
.contact-form-submit:focus-visible {
  outline: 2px solid var(--tw-accent);
  outline-offset: 2px;
}

/* Arrow points to the "start" side of the page, so mirror it in LTR */
html[dir="ltr"] .tool-back-btn svg {
  transform: scaleX(-1);
}

/* Moon in light mode, sun in dark mode */
.tool-theme-btn .icon-sun {
  display: none;
}

.tool-wrapper.dark-mode .tool-theme-btn .icon-sun {
  display: block;
}

.tool-wrapper.dark-mode .tool-theme-btn .icon-moon {
  display: none;
}

body.has-tool-wrapper {
  padding-top: calc(var(--tw-height) + env(safe-area-inset-top)) !important;
}

html.tw-modal-open {
  overflow: hidden;
}

/* Contact dialog */
.contact-modal {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 10000;
  padding: 20px;
  background: rgba(8, 12, 28, 0.55);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  animation: tw-fade-in 0.2s ease;
}

.contact-modal.active {
  display: flex;
  align-items: center;
  justify-content: center;
}

.contact-modal-content {
  width: 100%;
  max-width: 480px;
  max-height: min(90dvh, 720px);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 24px;
  border: 1px solid var(--tw-border);
  border-radius: 24px;
  background: var(--tw-surface-solid);
  color: var(--tw-fg);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
  animation: tw-pop 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.contact-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.contact-modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--tw-fg);
}

.contact-modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: var(--tw-field);
  color: var(--tw-muted);
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.contact-modal-close:hover {
  background: var(--tw-surface-hover);
  color: var(--tw-fg);
}

.contact-form-group {
  margin-bottom: 14px;
}

.contact-form-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--tw-muted);
}

.contact-form-input,
.contact-form-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--tw-border);
  border-radius: 12px;
  background: var(--tw-field);
  color: var(--tw-fg);
  font: inherit;
  font-size: 16px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.contact-form-input:focus,
.contact-form-textarea:focus {
  outline: none;
  border-color: var(--tw-accent);
  box-shadow: 0 0 0 4px rgba(124, 92, 255, 0.18);
}

.contact-form-textarea {
  min-height: 120px;
  resize: vertical;
}

.contact-form-submit {
  width: 100%;
  height: 48px;
  margin-top: 4px;
  border: 0;
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    var(--tw-accent),
    #5a8cff 55%,
    var(--tw-accent-2)
  );
  color: #fff;
  font: inherit;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(124, 92, 255, 0.3);
  transition:
    transform 0.15s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
}

.contact-form-submit:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(124, 92, 255, 0.4);
}

.contact-form-submit:active {
  transform: translateY(0);
}

.contact-form-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.contact-form-message {
  margin-top: 12px;
  padding: 12px;
  border-radius: 12px;
  font-size: 14px;
  text-align: center;
}

.contact-form-message.success {
  background: rgba(46, 233, 166, 0.12);
  color: var(--tw-ok);
  border: 1px solid rgba(46, 233, 166, 0.35);
}

.contact-form-message.error {
  background: rgba(255, 82, 82, 0.1);
  color: var(--tw-error);
  border: 1px solid rgba(255, 82, 82, 0.35);
}

@keyframes tw-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes tw-pop {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes tw-sheet-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

/* Mobile: dialog becomes a bottom sheet */
@media (max-width: 560px) {
  .tool-header {
    gap: 6px;
  }

  .tool-header-actions {
    gap: 4px;
  }

  .contact-modal {
    padding: 0;
  }

  .contact-modal.active {
    align-items: flex-end;
  }

  .contact-modal-content {
    max-width: none;
    max-height: 92dvh;
    padding: 12px 20px max(20px, env(safe-area-inset-bottom));
    border-width: 1px 0 0;
    border-radius: 24px 24px 0 0;
    animation: tw-sheet-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .contact-modal-content::before {
    content: "";
    display: block;
    width: 40px;
    height: 4px;
    margin: 0 auto 14px;
    border-radius: 2px;
    background: var(--tw-border);
  }
}

@media (prefers-reduced-motion: reduce) {
  .contact-modal,
  .contact-modal-content {
    animation: none;
  }

  .tool-back-btn,
  .tool-theme-btn,
  .tool-lang-btn,
  .tool-contact-btn,
  .contact-form-submit {
    transition: none;
  }
}
```

## File: tool-wrapper.js
```javascript
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
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
```

## File: tools.css
```css
:root {
  --font: "Vazirmatn", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  --radius-sm: 0.75rem;
  --radius: 1rem;
  --radius-lg: 1.5rem;

  color-scheme: light;
  --bg: #f4f5fb;
  --glow-1: rgb(124 92 255 / 0.14);
  --glow-2: rgb(46 233 166 / 0.1);
  --surface: #ffffff;
  --surface-2: #f1f2f9;
  --surface-3: #e7e9f4;
  --text: #12152b;
  --muted: #5a6079;
  --border: #e0e3ef;
  --border-strong: #c7cbe0;

  --accent: #6f4cff;
  --accent-hover: #5d3be8;
  --on-accent: #ffffff;
  --accent-soft: rgb(111 76 255 / 0.12);
  --accent-text: #5a38f0;

  --success: #0c8f64;
  --success-soft: rgb(12 143 100 / 0.12);
  --warning: #9a5b00;
  --warning-soft: rgb(217 119 6 / 0.14);
  --danger: #d62f2f;
  --danger-soft: rgb(214 47 47 / 0.1);
  --info: #1769c8;
  --info-soft: rgb(23 105 200 / 0.1);

  --shadow-sm: 0 1px 2px rgb(18 24 40 / 0.06);
  --shadow: 0 10px 30px rgb(18 24 40 / 0.08);
  --focus-ring: 0 0 0 3px rgb(111 76 255 / 0.35);
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: #0b1020;
  --glow-1: rgb(124 92 255 / 0.2);
  --glow-2: rgb(46 233 166 / 0.08);
  --surface: #131c3a;
  --surface-2: #1a2347;
  --surface-3: #232d58;
  --text: #f2f4ff;
  --muted: #a9b0d0;
  --border: rgb(255 255 255 / 0.12);
  --border-strong: rgb(255 255 255 / 0.22);

  --accent: #7c5cff;
  --accent-hover: #6b49f5;
  --accent-soft: rgb(124 92 255 / 0.22);
  --accent-text: #b0a3ff;

  --success: #2ee9a6;
  --success-soft: rgb(46 233 166 / 0.14);
  --warning: #fbbf24;
  --warning-soft: rgb(251 191 36 / 0.14);
  --danger: #ff8a8a;
  --danger-soft: rgb(255 122 122 / 0.14);
  --info: #7db8ff;
  --info-soft: rgb(125 184 255 / 0.14);

  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.3);
  --shadow: 0 16px 40px rgb(0 0 0 / 0.4);
  --focus-ring: 0 0 0 3px rgb(124 92 255 / 0.5);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    color-scheme: dark;
    --bg: #0b1020;
    --glow-1: rgb(124 92 255 / 0.2);
    --glow-2: rgb(46 233 166 / 0.08);
    --surface: #131c3a;
    --surface-2: #1a2347;
    --surface-3: #232d58;
    --text: #f2f4ff;
    --muted: #a9b0d0;
    --border: rgb(255 255 255 / 0.12);
    --border-strong: rgb(255 255 255 / 0.22);
    --accent: #7c5cff;
    --accent-hover: #6b49f5;
    --accent-soft: rgb(124 92 255 / 0.22);
    --accent-text: #b0a3ff;
    --success: #2ee9a6;
    --success-soft: rgb(46 233 166 / 0.14);
    --warning: #fbbf24;
    --warning-soft: rgb(251 191 36 / 0.14);
    --danger: #ff8a8a;
    --danger-soft: rgb(255 122 122 / 0.14);
    --info: #7db8ff;
    --info-soft: rgb(125 184 255 / 0.14);
    --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.3);
    --shadow: 0 16px 40px rgb(0 0 0 / 0.4);
    --focus-ring: 0 0 0 3px rgb(124 92 255 / 0.5);
  }
}

/* ---------- Base ---------- */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

body {
  margin: 0;
  min-height: 100dvh;
  font-family: var(--font);
  font-size: 1rem;
  line-height: 1.65;
  color: var(--text);
  background-color: var(--bg);
  background-image:
    radial-gradient(60rem 28rem at 15% -5%, var(--glow-1), transparent 60%),
    radial-gradient(48rem 26rem at 95% 0%, var(--glow-2), transparent 55%);
  background-repeat: no-repeat;
  overflow-wrap: anywhere;
}

h1,
h2,
h3,
h4,
p,
ul,
ol,
figure {
  margin: 0;
}

ul,
ol {
  padding: 0;
  list-style: none;
}

img,
svg,
canvas,
video {
  display: block;
  max-width: 100%;
}

button,
input,
select,
textarea {
  font: inherit;
  color: inherit;
}

a {
  color: var(--accent-text);
  text-underline-offset: 0.2em;
}

::selection {
  background: var(--accent-soft);
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

[hidden] {
  display: none !important;
}

/* ---------- Layout ---------- */
.page {
  width: min(100%, 72rem);
  margin-inline: auto;
  padding: calc(1.25rem + 0.5rem) max(1rem, env(safe-area-inset-right))
    calc(2rem + env(safe-area-inset-bottom))
    max(1rem, env(safe-area-inset-left));
}

.page--narrow {
  width: min(100%, 48rem);
}

.page-header {
  margin-bottom: 1.25rem;
}

.page-title {
  font-size: clamp(1.375rem, 1.1rem + 1.4vw, 2rem);
  line-height: 1.35;
  font-weight: 800;
}

.page-lead {
  margin-top: 0.25rem;
  color: var(--muted);
  font-size: 0.9375rem;
}

.page-footer {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
  color: var(--muted);
  font-size: 0.8125rem;
  text-align: center;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.grid-cards {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
}

.grid-cards--sm {
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 14rem), 1fr));
}

/* ---------- Card ---------- */
.card {
  padding: 1.125rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.card--lg {
  padding: clamp(1.125rem, 4vw, 1.75rem);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
}

.card-title {
  margin-bottom: 0.75rem;
  font-size: 1.0625rem;
  font-weight: 700;
}

@media (hover: hover) {
  .card--hover {
    transition:
      transform 0.15s ease,
      border-color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .card--hover:hover {
    transform: translateY(-2px);
    border-color: var(--accent);
    box-shadow: var(--shadow);
  }
}

/* ---------- Buttons ---------- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0.5rem 1.125rem;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  color: var(--text);
  font-weight: 600;
  line-height: 1.2;
  text-decoration: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    transform 0.1s ease;
}

.btn:active:not(:disabled) {
  transform: scale(0.98);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--primary {
  background: var(--accent);
  color: var(--on-accent);
}

.btn--secondary {
  border-color: var(--border-strong);
  background: var(--surface);
}

.btn--ghost {
  background: transparent;
  color: var(--muted);
}

.btn--danger {
  background: var(--danger-soft);
  color: var(--danger);
}

.btn--sm {
  min-height: 2.25rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
}

.btn--block {
  width: 100%;
}

@media (hover: hover) {
  .btn:hover:not(:disabled) {
    border-color: var(--accent);
  }

  .btn--primary:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  .btn--ghost:hover:not(:disabled) {
    background: var(--accent-soft);
    color: var(--text);
  }
}

/* ---------- Forms ---------- */
.label {
  display: block;
  margin-bottom: 0.375rem;
  color: var(--muted);
  font-size: 0.875rem;
  font-weight: 600;
}

.hint {
  margin-top: 0.375rem;
  color: var(--muted);
  font-size: 0.8125rem;
}

/* 16px font on inputs prevents the iOS zoom-on-focus */
.field {
  display: block;
  width: 100%;
  min-height: 2.75rem;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  font-size: 1rem;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease;
}

.field::placeholder {
  color: var(--muted);
  opacity: 0.8;
}

.field:focus {
  outline: none;
  border-color: var(--accent);
  background: var(--surface);
  box-shadow: var(--focus-ring);
}

textarea.field {
  min-height: 7rem;
  resize: vertical;
}

.search {
  position: relative;
  display: flex;
  align-items: center;
}

.search .field {
  padding-inline: 2.75rem;
  border-radius: 999px;
}

.search .field::-webkit-search-cancel-button {
  display: none;
}

.search-icon {
  position: absolute;
  inset-inline-start: 0.9rem;
  width: 1.25rem;
  height: 1.25rem;
  fill: none;
  stroke: var(--muted);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
}

.search-clear {
  position: absolute;
  inset-inline-end: 0.375rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--muted);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
}

.search-clear:hover {
  background: var(--accent-soft);
  color: var(--text);
}

/* ---------- Tabs ---------- */
.tabs {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface-2);
  overflow-x: auto;
  scrollbar-width: none;
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tab {
  flex: 1 0 auto;
  min-height: 2.75rem;
  padding: 0.5rem 1.125rem;
  border: 0;
  border-radius: calc(var(--radius) - 0.25rem);
  background: transparent;
  color: var(--muted);
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.tab[aria-selected="true"] {
  background: var(--accent);
  color: var(--on-accent);
  box-shadow: var(--shadow-sm);
}

@media (hover: hover) {
  .tab:hover:not([aria-selected="true"]) {
    color: var(--text);
  }
}

/* ---------- Badges, chips, alerts ---------- */
.badge,
.chip {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.625rem;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.6;
  white-space: nowrap;
}

.badge {
  background: var(--accent-soft);
  color: var(--accent-text);
}

.badge--success {
  background: var(--success-soft);
  color: var(--success);
}

.badge--warning {
  background: var(--warning-soft);
  color: var(--warning);
}

.chip {
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--muted);
  font-weight: 500;
}

.alert {
  padding: 0.75rem 1rem;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
}

.alert--info {
  border-color: var(--info);
  background: var(--info-soft);
  color: var(--info);
}

.alert--success {
  border-color: var(--success);
  background: var(--success-soft);
  color: var(--success);
}

.alert--warning {
  border-color: var(--warning);
  background: var(--warning-soft);
  color: var(--warning);
}

.alert--danger {
  border-color: var(--danger);
  background: var(--danger-soft);
  color: var(--danger);
}

.empty {
  padding: 2.5rem 1rem;
  color: var(--muted);
  text-align: center;
}

/* ---------- Tables ---------- */
.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9375rem;
}

.table th,
.table td {
  padding: 0.625rem 0.875rem;
  text-align: start;
}

.table th {
  background: var(--surface-2);
  color: var(--muted);
  font-weight: 700;
}

.table td {
  border-top: 1px solid var(--border);
}

/* ---------- Utilities ---------- */
.divider {
  height: 1px;
  margin-block: 1rem;
  border: 0;
  background: var(--border);
}

.muted {
  color: var(--muted);
}

.mono {
  font-family: var(--mono);
}

.ltr {
  direction: ltr;
  unicode-bidi: isolate;
}

.text-center {
  text-align: center;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

/* ---------- Small screens ---------- */
@media (max-width: 480px) {
  .page {
    padding-inline: max(0.75rem, env(safe-area-inset-right))
      max(0.75rem, env(safe-area-inset-left));
  }

  .card {
    padding: 1rem;
  }

  .row > .btn {
    flex: 1 1 auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* ---------- Append to assets/tools.css: segmented radio group ---------- */
.segmented {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 0.25rem;
  padding: 0.25rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface-2);
}

.segmented-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: calc(var(--radius) - 0.25rem);
  color: var(--muted);
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.segmented-item input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.segmented-item:has(input:checked) {
  background: var(--accent);
  color: var(--on-accent);
  box-shadow: var(--shadow-sm);
}

.segmented-item:has(input:focus-visible) {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* ---------- Append to assets/tools.css: modal built on <dialog> ---------- */
.modal {
  width: min(92vw, 32rem);
  max-height: 85dvh;
  margin: auto;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow);
}

.modal[open] {
  display: flex;
  flex-direction: column;
}

.modal::backdrop {
  background: rgb(8 12 28 / 0.6);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
}

.modal-header,
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
}

.modal-header {
  border-bottom: 1px solid var(--border);
}

.modal-footer {
  justify-content: center;
  border-top: 1px solid var(--border);
}

.modal-title {
  color: var(--accent-text);
  font-size: 1.125rem;
  font-weight: 800;
}

.modal-body {
  flex: 1;
  min-height: 0;
  padding: 1rem;
  overflow-y: auto;
}

/* ---------- Append to assets/tools.css (after tools-additions.css) ---------- */

.eyebrow {
  color: var(--accent-text);
  font-size: 0.8125rem;
  font-weight: 700;
}

.btn--icon {
  min-width: 2.5rem;
  min-height: 2.5rem;
  padding: 0;
}

/* Input + submit button on one line */
.input-row {
  display: flex;
  gap: 0.5rem;
}

.input-row .field {
  flex: 1;
  min-width: 0;
}

.field::file-selector-button {
  margin-inline-end: 0.75rem;
  padding: 0.25rem 0.75rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent-soft);
  color: var(--accent-text);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

/* Round checkbox */
.checkbox {
  display: inline-grid;
  flex: none;
  place-content: center;
  width: 1.5rem;
  height: 1.5rem;
  margin: 0;
  border: 2px solid var(--border-strong);
  border-radius: 50%;
  background: var(--surface);
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;
}

.checkbox::after {
  content: "";
  width: 0.375rem;
  height: 0.7rem;
  margin-top: -0.1rem;
  border: solid var(--bg);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) scale(0);
  transition: transform 0.12s ease;
}

.checkbox:checked {
  border-color: var(--success);
  background: var(--success);
}

.checkbox:checked::after {
  transform: rotate(45deg) scale(1);
}

/* Progress bar */
.progress {
  height: 0.5rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--surface-3);
}

.progress-bar {
  width: 0;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent), var(--success));
  transition: width 0.25s ease;
}

/* Toast */
.toast {
  position: fixed;
  inset-inline: 0;
  bottom: calc(1rem + env(safe-area-inset-bottom));
  z-index: 10000;
  width: fit-content;
  max-width: min(92vw, 28rem);
  margin-inline: auto;
  padding: 0.75rem 1.25rem;
  border-radius: 999px;
  background: var(--text);
  color: var(--bg);
  box-shadow: var(--shadow);
  font-size: 0.9375rem;
  font-weight: 600;
  text-align: center;
  animation: toast-in 0.2s ease;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(0.75rem);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* <dialog> that wraps a <form> */
.modal-form {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.modal-footer--split {
  justify-content: flex-end;
}
```
