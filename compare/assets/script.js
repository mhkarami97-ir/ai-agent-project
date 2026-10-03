(() => {
  "use strict";

  const STORAGE_KEYS = Object.freeze({
    left: "textCompare_leftText",
    right: "textCompare_rightText",
    view: "textCompare_view",
  });

  const AUTO_COMPARE_DELAY_MS = 400;
  const MAX_LINE_CELLS = 9_000_000;
  const MAX_TOKEN_CELLS = 250_000;
  const MIN_PAIR_SIMILARITY = 0.3;
  const SPLIT_BREAKPOINT = "(min-width: 900px)";

  /* ---------- Pure logic (no DOM) ---------- */

  class TextLines {
    /** Splits into lines; an empty text has no lines and a trailing newline is not an extra line. */
    static split(text) {
      if (text === "") return [];
      const lines = text.replace(/\r\n?/g, "\n").split("\n");
      if (lines.length > 1 && lines.at(-1) === "") lines.pop();
      return lines;
    }
  }

  class Lcs {
    /**
     * Longest common subsequence of two arrays.
     * Common head and tail are skipped first, which keeps typical edits cheap.
     * @returns {Array<[number, number]>} matched index pairs in order
     */
    static matches(a, b, maxCells) {
      let head = 0;
      while (head < a.length && head < b.length && a[head] === b[head]) head++;

      let tailA = a.length;
      let tailB = b.length;
      while (tailA > head && tailB > head && a[tailA - 1] === b[tailB - 1]) {
        tailA--;
        tailB--;
      }

      const rows = tailA - head;
      const cols = tailB - head;
      if (rows * cols > maxCells)
        throw new RangeError("Input is too large to compare");

      const pairs = [];
      for (let i = 0; i < head; i++) pairs.push([i, i]);

      if (rows > 0 && cols > 0) {
        const width = cols + 1;
        const table = new (
          Math.min(rows, cols) < 65535 ? Uint16Array : Uint32Array
        )((rows + 1) * width);

        for (let i = 1; i <= rows; i++) {
          for (let j = 1; j <= cols; j++) {
            table[i * width + j] =
              a[head + i - 1] === b[head + j - 1]
                ? table[(i - 1) * width + j - 1] + 1
                : Math.max(
                    table[(i - 1) * width + j],
                    table[i * width + j - 1],
                  );
          }
        }

        const middle = [];
        let i = rows;
        let j = cols;
        while (i > 0 && j > 0) {
          if (a[head + i - 1] === b[head + j - 1]) {
            middle.push([head + i - 1, head + j - 1]);
            i--;
            j--;
          } else if (table[(i - 1) * width + j] >= table[i * width + j - 1]) {
            i--;
          } else {
            j--;
          }
        }
        for (let k = middle.length - 1; k >= 0; k--) pairs.push(middle[k]);
      }

      for (let k = 0; tailA + k < a.length; k++)
        pairs.push([tailA + k, tailB + k]);
      return pairs;
    }
  }

  class TokenDiff {
    static #TOKEN = /\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu;

    /**
     * Word-level difference of two lines.
     * @returns {{left: Segment[], right: Segment[], similarity: number}}
     */
    static compare(oldText, newText) {
      const a = oldText.match(TokenDiff.#TOKEN) ?? [];
      const b = newText.match(TokenDiff.#TOKEN) ?? [];

      if (a.length * b.length > MAX_TOKEN_CELLS) {
        return {
          left: [{ text: oldText, changed: true }],
          right: [{ text: newText, changed: true }],
          similarity: 1,
        };
      }

      const pairs = Lcs.matches(a, b, MAX_TOKEN_CELLS);
      const keptA = new Set(pairs.map(([i]) => i));
      const keptB = new Set(pairs.map(([, j]) => j));
      const keptLength = pairs.reduce((sum, [i]) => sum + a[i].length, 0);
      const total = oldText.length + newText.length;

      return {
        left: TokenDiff.#toSegments(a, keptA),
        right: TokenDiff.#toSegments(b, keptB),
        similarity: total === 0 ? 1 : (2 * keptLength) / total,
      };
    }

    static #toSegments(tokens, kept) {
      const segments = [];
      tokens.forEach((token, index) => {
        const changed = !kept.has(index);
        const last = segments.at(-1);
        if (last && last.changed === changed) last.text += token;
        else segments.push({ text: token, changed });
      });
      return segments;
    }
  }

  class LineDiff {
    /**
     * @returns {Array<{type: 'unchanged'|'removed'|'added'|'modified', ...}>}
     */
    static compute(leftLines, rightLines) {
      const items = [];
      let hunkRemoved = [];
      let hunkAdded = [];

      const flush = () => {
        items.push(...LineDiff.#resolveHunk(hunkRemoved, hunkAdded));
        hunkRemoved = [];
        hunkAdded = [];
      };

      let i = 0;
      let j = 0;
      const walk = (untilLeft, untilRight) => {
        while (i < untilLeft)
          hunkRemoved.push({ no: i + 1, text: leftLines[i++] });
        while (j < untilRight)
          hunkAdded.push({ no: j + 1, text: rightLines[j++] });
      };

      for (const [matchLeft, matchRight] of Lcs.matches(
        leftLines,
        rightLines,
        MAX_LINE_CELLS,
      )) {
        walk(matchLeft, matchRight);
        flush();
        items.push({
          type: "unchanged",
          leftNo: ++i,
          rightNo: ++j,
          text: leftLines[i - 1],
        });
      }
      walk(leftLines.length, rightLines.length);
      flush();

      return items;
    }

    static stats(items) {
      const stats = { added: 0, removed: 0, modified: 0, unchanged: 0 };
      for (const item of items) stats[item.type]++;
      return stats;
    }

    /** Pairs removed and added lines of one hunk; similar pairs become "modified". */
    static #resolveHunk(removed, added) {
      const result = [];
      const pairCount = Math.min(removed.length, added.length);

      for (let k = 0; k < pairCount; k++) {
        const diff = TokenDiff.compare(removed[k].text, added[k].text);
        if (diff.similarity >= MIN_PAIR_SIMILARITY) {
          result.push({
            type: "modified",
            leftNo: removed[k].no,
            rightNo: added[k].no,
            leftSegments: diff.left,
            rightSegments: diff.right,
          });
        } else {
          result.push({
            type: "removed",
            leftNo: removed[k].no,
            text: removed[k].text,
          });
          result.push({
            type: "added",
            rightNo: added[k].no,
            text: added[k].text,
          });
        }
      }
      for (const line of removed.slice(pairCount))
        result.push({ type: "removed", leftNo: line.no, text: line.text });
      for (const line of added.slice(pairCount))
        result.push({ type: "added", rightNo: line.no, text: line.text });
      return result;
    }
  }

  /* ---------- Services ---------- */

  class I18n {
    #translations = {};
    #lang = localStorage.getItem("lang") || "fa";

    get numberFormat() {
      return new Intl.NumberFormat(this.#lang === "fa" ? "fa-IR" : "en-US");
    }

    async load() {
      try {
        const response = await fetch("assets/translations.json");
        this.#translations = await response.json();
      } catch (error) {
        console.error("Failed to load translations:", error);
      }
      this.apply();
    }

    t(key, params = {}) {
      const template = this.#translations[this.#lang]?.[key] ?? key;
      return template.replace(
        /\{(\w+)\}/g,
        (match, name) => params[name] ?? match,
      );
    }

    apply() {
      const html = document.documentElement;
      html.lang = this.#lang;
      html.dir = this.#lang === "fa" ? "rtl" : "ltr";

      for (const element of document.querySelectorAll("[data-i18n]")) {
        element.textContent = this.t(element.dataset.i18n);
      }
      for (const element of document.querySelectorAll(
        "[data-i18n-placeholder]",
      )) {
        element.placeholder = this.t(element.dataset.i18nPlaceholder);
      }
      for (const element of document.querySelectorAll("[data-i18n-label]")) {
        element.setAttribute("aria-label", this.t(element.dataset.i18nLabel));
      }

      const titleKey = document.querySelector("title")?.dataset.i18n;
      if (titleKey) document.title = this.t(titleKey);
    }
  }

  const storage = Object.freeze({
    get: (key) => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set: (key, value) => {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.warn("Could not save to storage:", error);
      }
    },
  });

  /* ---------- Rendering ---------- */

  const SIGNS = Object.freeze({
    added: "+",
    removed: "−",
    modified: "",
    unchanged: "",
  });

  class DiffRenderer {
    static split(items, leftContainer, rightContainer) {
      const left = document.createDocumentFragment();
      const right = document.createDocumentFragment();

      for (const item of items) {
        switch (item.type) {
          case "unchanged":
            left.append(DiffRenderer.#row("unchanged", item.leftNo, item.text));
            right.append(
              DiffRenderer.#row("unchanged", item.rightNo, item.text),
            );
            break;
          case "removed":
            left.append(DiffRenderer.#row("removed", item.leftNo, item.text));
            right.append(DiffRenderer.#placeholder());
            break;
          case "added":
            left.append(DiffRenderer.#placeholder());
            right.append(DiffRenderer.#row("added", item.rightNo, item.text));
            break;
          default:
            left.append(
              DiffRenderer.#row("modified", item.leftNo, item.leftSegments),
            );
            right.append(
              DiffRenderer.#row("modified", item.rightNo, item.rightSegments),
            );
        }
      }
      leftContainer.replaceChildren(left);
      rightContainer.replaceChildren(right);
    }

    static unified(items, container) {
      const fragment = document.createDocumentFragment();

      for (const item of items) {
        if (item.type === "modified") {
          fragment.append(
            DiffRenderer.#row("removed", item.leftNo, item.leftSegments),
            DiffRenderer.#row("added", item.rightNo, item.rightSegments),
          );
        } else {
          fragment.append(
            DiffRenderer.#row(
              item.type,
              item.type === "added" ? item.rightNo : item.leftNo,
              item.text,
            ),
          );
        }
      }
      container.replaceChildren(fragment);
    }

    /** @param {string|Segment[]} content */
    static #row(type, lineNumber, content) {
      const row = document.createElement("div");
      row.className = `diff-line diff-line--${type}`;

      const gutter = document.createElement("span");
      gutter.className = "diff-no";
      gutter.setAttribute("aria-hidden", "true");
      gutter.textContent = lineNumber;

      const sign = document.createElement("span");
      sign.className = "diff-sign";
      sign.setAttribute("aria-hidden", "true");
      sign.textContent = SIGNS[type];

      const text = document.createElement("span");
      text.className = "diff-text";
      text.dir = "auto";

      if (typeof content === "string") {
        text.textContent = content === "" ? "\u00A0" : content;
      } else {
        text.append(
          ...content.map((segment) => {
            if (!segment.changed) return document.createTextNode(segment.text);
            const mark = document.createElement("mark");
            mark.textContent = segment.text;
            return mark;
          }),
        );
      }

      row.append(gutter, sign, text);
      return row;
    }

    static #placeholder() {
      const row = document.createElement("div");
      row.className = "diff-line diff-line--empty";
      row.setAttribute("aria-hidden", "true");
      row.textContent = "\u00A0";
      return row;
    }
  }

  /* ---------- Application ---------- */

  class TextCompareApp {
    #i18n = new I18n();
    #dom;
    #debounceTimer = 0;
    #view = "split";
    #isSyncingScroll = false;

    async init() {
      this.#cacheDom();
      await this.#i18n.load();

      this.#dom.left.value = storage.get(STORAGE_KEYS.left) ?? "";
      this.#dom.right.value = storage.get(STORAGE_KEYS.right) ?? "";
      this.#view = this.#readInitialView();
      this.#dom.viewInputs.forEach((input) => {
        input.checked = input.value === this.#view;
      });

      this.#bindEvents();
      this.#updateLineCounts();
      this.#applyView();
      if (this.#hasText()) this.#compare({ shouldScroll: false });
      window.addEventListener("languageChanged", () =>
        window.location.reload(),
      );
    }

    #cacheDom() {
      const byId = (id) => document.getElementById(id);
      this.#dom = {
        left: byId("leftText"),
        right: byId("rightText"),
        compare: byId("compareBtn"),
        clear: byId("clearBtn"),
        swap: byId("swapBtn"),
        result: byId("diffContainer"),
        leftDiff: byId("leftDiff"),
        rightDiff: byId("rightDiff"),
        unifiedDiff: byId("unifiedDiff"),
        diffView: byId("diffView"),
        stats: byId("stats"),
        leftCount: byId("leftLineCount"),
        rightCount: byId("rightLineCount"),
        status: byId("compareStatus"),
        viewInputs: [...document.querySelectorAll('input[name="view"]')],
      };
    }

    #readInitialView() {
      const saved = storage.get(STORAGE_KEYS.view);
      if (saved === "split" || saved === "unified") return saved;
      return window.matchMedia(SPLIT_BREAKPOINT).matches ? "split" : "unified";
    }

    #bindEvents() {
      const dom = this.#dom;

      dom.compare.addEventListener("click", () =>
        this.#compare({ shouldScroll: true }),
      );
      dom.clear.addEventListener("click", () => this.#clear());
      dom.swap.addEventListener("click", () => this.#swap());

      for (const [textarea, key] of [
        [dom.left, STORAGE_KEYS.left],
        [dom.right, STORAGE_KEYS.right],
      ]) {
        textarea.addEventListener("input", () => {
          this.#updateLineCounts();
          storage.set(key, textarea.value);
          this.#scheduleCompare();
        });
      }

      for (const input of dom.viewInputs) {
        input.addEventListener("change", () => {
          this.#view = input.value;
          storage.set(STORAGE_KEYS.view, this.#view);
          this.#applyView();
          if (this.#hasText()) this.#compare({ shouldScroll: false });
        });
      }

      dom.leftDiff.addEventListener(
        "scroll",
        () => this.#syncScroll(dom.leftDiff, dom.rightDiff),
        { passive: true },
      );
      dom.rightDiff.addEventListener(
        "scroll",
        () => this.#syncScroll(dom.rightDiff, dom.leftDiff),
        { passive: true },
      );
    }

    /* ----- actions ----- */

    #hasText() {
      return (
        this.#dom.left.value.trim() !== "" ||
        this.#dom.right.value.trim() !== ""
      );
    }

    #scheduleCompare() {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = setTimeout(() => {
        if (this.#hasText()) this.#compare({ shouldScroll: false });
        else this.#dom.result.hidden = true;
      }, AUTO_COMPARE_DELAY_MS);
    }

    #clear() {
      this.#dom.left.value = "";
      this.#dom.right.value = "";
      this.#dom.result.hidden = true;
      this.#updateLineCounts();
      storage.set(STORAGE_KEYS.left, "");
      storage.set(STORAGE_KEYS.right, "");
      this.#dom.left.focus();
    }

    #swap() {
      const { left, right } = this.#dom;
      [left.value, right.value] = [right.value, left.value];
      this.#updateLineCounts();
      storage.set(STORAGE_KEYS.left, left.value);
      storage.set(STORAGE_KEYS.right, right.value);
      if (!this.#dom.result.hidden) this.#compare({ shouldScroll: false });
    }

    #compare({ shouldScroll }) {
      clearTimeout(this.#debounceTimer);
      const dom = this.#dom;

      try {
        const items = LineDiff.compute(
          TextLines.split(dom.left.value),
          TextLines.split(dom.right.value),
        );

        if (this.#view === "split")
          DiffRenderer.split(items, dom.leftDiff, dom.rightDiff);
        else DiffRenderer.unified(items, dom.unifiedDiff);

        const stats = LineDiff.stats(items);
        this.#renderStats(stats);
        if (stats.added + stats.removed + stats.modified === 0)
          this.#showStatus("no_changes", "success");
        else this.#hideStatus();
      } catch (error) {
        console.warn("compare failed", error);
        this.#showStatus("error_too_large", "danger");
        dom.result.hidden = true;
        return;
      }

      dom.result.hidden = false;
      if (shouldScroll)
        dom.result.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    /* ----- view ----- */

    #applyView() {
      this.#dom.diffView.dataset.view = this.#view;
    }

    #syncScroll(source, target) {
      if (this.#isSyncingScroll) return;
      this.#isSyncingScroll = true;
      target.scrollTop = source.scrollTop;
      requestAnimationFrame(() => {
        this.#isSyncingScroll = false;
      });
    }

    #updateLineCounts() {
      const format = this.#i18n.numberFormat;
      this.#dom.leftCount.textContent = this.#i18n.t("lines_count", {
        n: format.format(TextLines.split(this.#dom.left.value).length),
      });
      this.#dom.rightCount.textContent = this.#i18n.t("lines_count", {
        n: format.format(TextLines.split(this.#dom.right.value).length),
      });
    }

    #renderStats(stats) {
      const format = this.#i18n.numberFormat;
      const entries = [
        ["added", "stat_added"],
        ["removed", "stat_removed"],
        ["modified", "stat_modified"],
        ["unchanged", "stat_unchanged"],
      ];

      this.#dom.stats.replaceChildren(
        ...entries.map(([type, labelKey]) => {
          const item = document.createElement("div");
          item.className = "stat";

          const value = document.createElement("span");
          value.className = `stat-value stat-value--${type}`;
          value.textContent = format.format(stats[type]);

          const label = document.createElement("span");
          label.className = "stat-label";
          label.textContent = this.#i18n.t(labelKey);

          item.append(value, label);
          return item;
        }),
      );
    }

    #showStatus(messageKey, variant) {
      const status = this.#dom.status;
      status.className = `alert alert--${variant}`;
      status.textContent = this.#i18n.t(messageKey);
      status.hidden = false;
    }

    #hideStatus() {
      this.#dom.status.hidden = true;
    }
  }

  new TextCompareApp().init();
})();
