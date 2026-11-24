(() => {
  "use strict";

  const STRINGS = Object.freeze({
    fa: {
      error: "خطا",
      emptyHistory: "تاریخچه‌ای وجود ندارد",
      confirmClear: "آیا مطمئن هستید که می‌خواهید تاریخچه را پاک کنید؟",
      graphEmpty: "لطفا تابع را وارد کنید",
      graphRange: "محدوده‌های X و Y معتبر نیستند",
      graphSyntax: "تابع نامعتبر است",
      examples: "مثال‌های تابع",
    },
    en: {
      error: "Error",
      emptyHistory: "No history yet",
      confirmClear: "Are you sure you want to clear the history?",
      graphEmpty: "Please enter a function",
      graphRange: "The X and Y ranges are not valid",
      graphSyntax: "The function is not valid",
      examples: "Function examples",
    },
  });

  const GRAPH_EXAMPLES = Object.freeze([
    { fn: "x^2", fa: "سهمی", en: "Parabola" },
    { fn: "sin(x)", fa: "سینوسی", en: "Sine" },
    { fn: "cos(x)", fa: "کسینوسی", en: "Cosine" },
    { fn: "tan(x)", fa: "تانژانتی", en: "Tangent" },
    { fn: "exp(x)", fa: "نمایی", en: "Exponential" },
    { fn: "ln(x)", fa: "لگاریتمی", en: "Logarithm" },
    { fn: "sqrt(x)", fa: "رادیکالی", en: "Square root" },
    { fn: "abs(x)", fa: "قدر مطلق", en: "Absolute value" },
  ]);

  const toRadians = (value, degrees) =>
    degrees ? (value * Math.PI) / 180 : value;
  const fromRadians = (value, degrees) =>
    degrees ? (value * 180) / Math.PI : value;

  const factorial = (value) => {
    const n = Math.floor(value);
    if (n < 0 || n > 170) return NaN;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  };

  const MATH_FUNCTIONS = Object.freeze({
    sin: (v, d) => Math.sin(toRadians(v, d)),
    cos: (v, d) => Math.cos(toRadians(v, d)),
    tan: (v, d) => Math.tan(toRadians(v, d)),
    asin: (v, d) => fromRadians(Math.asin(v), d),
    acos: (v, d) => fromRadians(Math.acos(v), d),
    atan: (v, d) => fromRadians(Math.atan(v), d),
    sqrt: (v) => Math.sqrt(v),
    ln: (v) => Math.log(v),
    log: (v) => Math.log10(v),
    exp: (v) => Math.exp(v),
    abs: (v) => Math.abs(v),
  });

  const KEY_FUNCTIONS = Object.freeze({
    ...MATH_FUNCTIONS,
    square: (v) => v * v,
    cube: (v) => v ** 3,
    factorial,
    inv: (v) => 1 / v,
  });

  const CONSTANTS = Object.freeze({ pi: Math.PI, e: Math.E });

  /* ---------- Expression parsing (no eval) ---------- */

  class ExpressionParser {
    #tokens;
    #position = 0;
    #degrees;

    constructor(tokens, degrees) {
      this.#tokens = tokens;
      this.#degrees = degrees;
    }

    parse() {
      const node = this.#expression();
      if (this.#position < this.#tokens.length) {
        throw new SyntaxError(`Unexpected token ${this.#peek()}`);
      }
      return node;
    }

    #peek() {
      return this.#tokens[this.#position];
    }

    #next() {
      return this.#tokens[this.#position++];
    }

    #expect(token) {
      if (this.#next() !== token) throw new SyntaxError(`Expected ${token}`);
    }

    static #startsOperand(token) {
      return token !== undefined && (token === "(" || /^[\d.a-z_]/.test(token));
    }

    #expression() {
      let left = this.#term();
      while (this.#peek() === "+" || this.#peek() === "-") {
        const operator = this.#next();
        const l = left;
        const r = this.#term();
        left = operator === "+" ? (s) => l(s) + r(s) : (s) => l(s) - r(s);
      }
      return left;
    }

    #term() {
      let left = this.#unary();
      for (;;) {
        const token = this.#peek();
        const isExplicit = token === "*" || token === "/";
        if (!isExplicit && !ExpressionParser.#startsOperand(token)) return left;

        if (isExplicit) this.#next();
        const l = left;
        const r = this.#unary();
        left = token === "/" ? (s) => l(s) / r(s) : (s) => l(s) * r(s);
      }
    }

    #unary() {
      const token = this.#peek();
      if (token === "-") {
        this.#next();
        const operand = this.#unary();
        return (s) => -operand(s);
      }
      if (token === "+") {
        this.#next();
        return this.#unary();
      }
      return this.#power();
    }

    #power() {
      const base = this.#primary();
      if (this.#peek() !== "^") return base;

      this.#next();
      const exponent = this.#unary();
      return (s) => Math.pow(base(s), exponent(s));
    }

    #primary() {
      const token = this.#next();
      if (token === undefined)
        throw new SyntaxError("Unexpected end of expression");

      if (/^[\d.]/.test(token)) {
        const value = Number(token);
        return () => value;
      }
      if (token === "(") {
        const inner = this.#expression();
        this.#expect(")");
        return inner;
      }
      if (/^[a-z_]/.test(token)) return this.#identifier(token);

      throw new SyntaxError(`Unexpected token ${token}`);
    }

    #identifier(name) {
      if (Object.hasOwn(MATH_FUNCTIONS, name)) {
        this.#expect("(");
        const argument = this.#expression();
        this.#expect(")");
        const fn = MATH_FUNCTIONS[name];
        const degrees = this.#degrees;
        return (s) => fn(argument(s), degrees);
      }
      if (Object.hasOwn(CONSTANTS, name)) {
        const value = CONSTANTS[name];
        return () => value;
      }
      if (name === "x") return (s) => s.x;

      throw new SyntaxError(`Unknown identifier ${name}`);
    }
  }

  class ExpressionEvaluator {
    static compile(source, { degrees = false } = {}) {
      return new ExpressionParser(
        ExpressionEvaluator.#tokenize(source),
        degrees,
      ).parse();
    }

    static evaluate(source, options) {
      return ExpressionEvaluator.compile(source, options)({ x: 0 });
    }

    static #tokenize(source) {
      const normalized = source
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/−/g, "-")
        .replace(/π/g, "pi")
        .replace(/\s+/g, "")
        .toLowerCase();

      const tokens =
        normalized.match(
          /(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?|[a-z_]\w*|[-+*/^()]/g,
        ) ?? [];
      if (tokens.join("") !== normalized)
        throw new SyntaxError("Unexpected character");
      return tokens;
    }
  }

  class ProgrammerEvaluator {
    static #PRECEDENCE = Object.freeze({
      "|": 1,
      "^": 2,
      "&": 3,
      "<<": 4,
      ">>": 4,
      "+": 5,
      "-": 5,
      "*": 6,
      "/": 6,
    });

    static #OPERATIONS = Object.freeze({
      "|": (a, b) => a | b,
      "^": (a, b) => a ^ b,
      "&": (a, b) => a & b,
      "<<": (a, b) => a << b,
      ">>": (a, b) => a >> b,
      "+": (a, b) => a + b,
      "-": (a, b) => a - b,
      "*": (a, b) => a * b,
      "/": (a, b) => {
        if (b === 0n) throw new RangeError("Division by zero");
        return a / b;
      },
    });

    static isValidDigit(char, base) {
      return /^[0-9A-F]$/.test(char) && Number.parseInt(char, 36) < base;
    }

    static evaluate(expression, base) {
      const normalized = expression
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/−/g, "-")
        .replace(/\s+/g, "")
        .toUpperCase();
      const tokens = normalized.match(/[0-9A-F]+|<<|>>|[-+*/&|^]/g) ?? [];
      if (tokens.join("") !== normalized)
        throw new SyntaxError("Unexpected character");

      let position = 0;

      const operand = () => {
        const token = tokens[position++];
        if (token === undefined)
          throw new SyntaxError("Unexpected end of expression");
        if (token === "-") return -operand();
        return ProgrammerEvaluator.#parseDigits(token, base);
      };

      const parse = (minPrecedence) => {
        let left = operand();
        for (;;) {
          const operator = tokens[position];
          const precedence = ProgrammerEvaluator.#PRECEDENCE[operator];
          if (precedence === undefined || precedence < minPrecedence)
            return left;

          position++;
          const right = parse(precedence + 1);
          left = ProgrammerEvaluator.#OPERATIONS[operator](left, right);
        }
      };

      const value = parse(1);
      if (position < tokens.length) throw new SyntaxError("Unexpected token");
      return value;
    }

    static #parseDigits(token, base) {
      let result = 0n;
      for (const char of token) {
        if (!ProgrammerEvaluator.isValidDigit(char, base))
          throw new SyntaxError(`Invalid digit ${char}`);
        result = result * BigInt(base) + BigInt(Number.parseInt(char, 36));
      }
      return result;
    }
  }

  /* ---------- Services ---------- */

  class I18n {
    #translations = {};
    #lang = localStorage.getItem("lang") || "fa";

    get lang() {
      return this.#lang;
    }

    async init() {
      try {
        const response = await fetch("assets/translations.json");
        this.#translations = await response.json();
      } catch (error) {
        console.error("Failed to load translations:", error);
      }
      this.apply();
    }

    t(key) {
      return this.#translations[this.#lang]?.[key] ?? null;
    }

    s(key) {
      return STRINGS[this.#lang]?.[key] ?? STRINGS.fa[key];
    }

    apply() {
      const html = document.documentElement;
      html.lang = this.#lang;
      html.dir = this.#lang === "fa" ? "rtl" : "ltr";

      for (const element of document.querySelectorAll("[data-i18n]")) {
        const text = this.t(element.dataset.i18n);
        if (text !== null) element.textContent = text;
      }

      const titleKey = document.querySelector("title")?.dataset.i18n;
      const title = titleKey ? this.t(titleKey) : null;
      if (title !== null) document.title = title;

      document
        .querySelector("[data-examples-title]")
        ?.replaceChildren(this.s("examples"));
    }
  }

  class HistoryStore {
    static #KEY = "calculatorHistory";
    static #MAX_ITEMS = 50;

    list() {
      try {
        return JSON.parse(localStorage.getItem(HistoryStore.#KEY)) ?? [];
      } catch {
        return [];
      }
    }

    add(entry) {
      const items = [entry, ...this.list()].slice(0, HistoryStore.#MAX_ITEMS);
      localStorage.setItem(HistoryStore.#KEY, JSON.stringify(items));
    }

    clear() {
      localStorage.removeItem(HistoryStore.#KEY);
    }
  }

  class HistoryDialog {
    #dialog;
    #list;
    #store;
    #i18n;
    #onSelect;

    constructor({ dialog, list, store, i18n, onSelect }) {
      this.#dialog = dialog;
      this.#list = list;
      this.#store = store;
      this.#i18n = i18n;
      this.#onSelect = onSelect;

      // Clicks on the backdrop target the dialog element itself
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) this.close();
      });
    }

    get isOpen() {
      return this.#dialog.open;
    }

    open() {
      this.#render();
      if (!this.#dialog.open) this.#dialog.showModal();
    }

    close() {
      this.#dialog.close();
    }

    clear() {
      if (!confirm(this.#i18n.s("confirmClear"))) return;
      this.#store.clear();
      this.#render();
    }

    #render() {
      const items = this.#store.list();
      if (items.length === 0) {
        const empty = document.createElement("li");
        empty.className = "py-10 text-center text-muted";
        empty.textContent = this.#i18n.s("emptyHistory");
        this.#list.replaceChildren(empty);
        return;
      }
      this.#list.replaceChildren(
        ...items.map((item) => this.#createItem(item)),
      );
    }

    #createItem(item) {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "w-full rounded-xl border border-line bg-surface-2 p-3 text-start transition hover:border-accent";

      const expression = document.createElement("div");
      expression.className = "text-left font-mono text-sm text-muted";
      expression.dir = "ltr";
      expression.textContent = item.expression;

      const result = document.createElement("div");
      result.className = "text-left font-mono text-lg font-semibold";
      result.dir = "ltr";
      result.textContent = `= ${item.result}`;

      const time = document.createElement("div");
      time.className = "mt-1 text-xs text-muted";
      time.textContent = item.timestamp;

      button.append(expression, result, time);
      button.addEventListener("click", () => {
        this.#onSelect(item.result);
        this.close();
      });
      li.append(button);
      return li;
    }
  }

  class GraphPlotter {
    #canvas;
    #input;
    #ranges;
    #errorBox;
    #i18n;
    #last = null;

    constructor(i18n) {
      this.#i18n = i18n;
      this.#canvas = document.getElementById("graph-canvas");
      this.#input = document.getElementById("graph-function");
      this.#errorBox = document.getElementById("graph-error");
      this.#ranges = ["x-min", "x-max", "y-min", "y-max"].map((id) =>
        document.getElementById(id),
      );

      this.#renderExamples();
      new MutationObserver(() => this.refresh()).observe(
        document.documentElement,
        { attributes: true, attributeFilter: ["data-theme"] },
      );
      new ResizeObserver(() => this.refresh()).observe(this.#canvas);
    }

    setFunction(fn) {
      this.#input.value = fn;
      this.draw();
    }

    draw() {
      this.#hideError();

      const source = this.#input.value.trim();
      if (!source) return this.#showError("graphEmpty");

      const [xMin, xMax, yMin, yMax] = this.#ranges.map((input) =>
        Number.parseFloat(input.value),
      );
      if (
        ![xMin, xMax, yMin, yMax].every(Number.isFinite) ||
        xMin >= xMax ||
        yMin >= yMax
      ) {
        return this.#showError("graphRange");
      }

      try {
        this.#last = {
          evaluate: ExpressionEvaluator.compile(source),
          xMin,
          xMax,
          yMin,
          yMax,
        };
      } catch {
        return this.#showError("graphSyntax");
      }
      this.refresh();
    }

    clear() {
      this.#last = null;
      this.#hideError();
      this.#prepareContext();
    }

    refresh() {
      const context = this.#prepareContext();
      if (!context || !this.#last) return;

      const { colors, size } = context;
      this.#drawGrid(context.ctx, size, colors);
      this.#drawCurve(context.ctx, size, colors);
    }

    #prepareContext() {
      const size = Math.round(this.#canvas.clientWidth);
      if (size === 0) return null;

      const ratio = window.devicePixelRatio || 1;
      const pixels = Math.round(size * ratio);
      if (this.#canvas.width !== pixels) {
        this.#canvas.width = pixels;
        this.#canvas.height = pixels;
      }

      const ctx = this.#canvas.getContext("2d");
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, size, size);
      return { ctx, size, colors: this.#readColors() };
    }

    #readColors() {
      const styles = getComputedStyle(document.documentElement);
      const read = (name) => styles.getPropertyValue(name).trim();
      return {
        line: read("--line"),
        fg: read("--fg"),
        muted: read("--muted"),
        accent: read("--accent"),
      };
    }

    #drawGrid(ctx, size, colors) {
      const { xMin, xMax, yMin, yMax } = this.#last;

      ctx.lineWidth = 1;
      ctx.strokeStyle = colors.line;
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        const offset = (i / 10) * size;
        ctx.moveTo(offset, 0);
        ctx.lineTo(offset, size);
        ctx.moveTo(0, offset);
        ctx.lineTo(size, offset);
      }
      ctx.stroke();

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = colors.fg;
      ctx.beginPath();
      const axisY = size * (yMax / (yMax - yMin));
      const axisX = size * (-xMin / (xMax - xMin));
      if (axisY >= 0 && axisY <= size) {
        ctx.moveTo(0, axisY);
        ctx.lineTo(size, axisY);
      }
      if (axisX >= 0 && axisX <= size) {
        ctx.moveTo(axisX, 0);
        ctx.lineTo(axisX, size);
      }
      ctx.stroke();

      ctx.fillStyle = colors.muted;
      ctx.font = "11px Vazirmatn, sans-serif";
      ctx.textBaseline = "bottom";
      ctx.textAlign = "left";
      ctx.fillText(String(xMin), 4, size - 4);
      ctx.textAlign = "right";
      ctx.fillText(String(xMax), size - 4, size - 4);
      ctx.textBaseline = "top";
      ctx.fillText(String(yMax), size - 4, 4);
    }

    #drawCurve(ctx, size, colors) {
      const { evaluate, xMin, xMax, yMin, yMax } = this.#last;
      const steps = size * 2;

      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.strokeStyle = colors.accent;
      ctx.beginPath();

      let isDrawing = false;
      let previousY = 0;

      for (let i = 0; i <= steps; i++) {
        const x = xMin + (i / steps) * (xMax - xMin);
        let y;
        try {
          y = evaluate({ x });
        } catch {
          isDrawing = false;
          continue;
        }

        const canvasX = (i / steps) * size;
        const canvasY = size - ((y - yMin) / (yMax - yMin)) * size;

        if (!Number.isFinite(y) || canvasY < -size || canvasY > size * 2) {
          isDrawing = false;
          continue;
        }

        // A huge jump between neighbours is an asymptote (e.g. tan), do not connect it
        if (isDrawing && Math.abs(canvasY - previousY) < size * 0.9) {
          ctx.lineTo(canvasX, canvasY);
        } else {
          ctx.moveTo(canvasX, canvasY);
        }
        isDrawing = true;
        previousY = canvasY;
      }
      ctx.stroke();
    }

    #renderExamples() {
      const container = document.getElementById("graph-examples");
      const lang = this.#i18n.lang;
      container.replaceChildren(
        ...GRAPH_EXAMPLES.map((example) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "btn btn-secondary btn-sm font-mono";
          button.dataset.action = "example";
          button.dataset.value = example.fn;
          button.textContent = `${example.fn} · ${example[lang]}`;
          return button;
        }),
      );
    }

    #showError(key) {
      this.#errorBox.textContent = this.#i18n.s(key);
      this.#errorBox.hidden = false;
    }

    #hideError() {
      this.#errorBox.hidden = true;
    }
  }

  /* ---------- Keypad layouts ---------- */

  const KEY_STYLES = Object.freeze({
    digit: "btn btn-secondary h-12 text-lg sm:h-14",
    utility: "btn btn-secondary h-12 text-lg text-accent-text sm:h-14",
    operator: "btn btn-primary h-12 text-lg sm:h-14",
    compact: "btn btn-primary h-12 text-xs sm:h-14 sm:text-sm",
    function:
      "btn h-12 border-line bg-accent-soft text-sm text-accent-text hover:border-accent sm:h-14",
    equals:
      "btn h-12 bg-success text-lg text-page hover:brightness-110 sm:h-14",
  });

  const key = (label, action, kind, value = label, className = "") =>
    Object.freeze({ label, action, kind, value, className });
  const digit = (char, className = "") =>
    key(char, "digit", "digit", char, className);
  const operator = (symbol) => key(symbol, "operator", "operator");
  const utility = (label, action) => key(label, action, "utility");
  const fn = (label, name) => key(label, "function", "function", name);

  const KEY_LAYOUTS = Object.freeze({
    padBasic: [
      utility("C", "clear"),
      utility("⌫", "back"),
      utility("%", "percent"),
      operator("÷"),
      digit("7"),
      digit("8"),
      digit("9"),
      operator("×"),
      digit("4"),
      digit("5"),
      digit("6"),
      operator("−"),
      digit("1"),
      digit("2"),
      digit("3"),
      operator("+"),
      digit("0", "col-span-2"),
      digit("."),
      key("=", "equals", "equals"),
    ],
    scientific: [
      fn("sin", "sin"),
      fn("cos", "cos"),
      fn("tan", "tan"),
      fn("asin", "asin"),
      fn("acos", "acos"),
      fn("atan", "atan"),
      fn("ln", "ln"),
      fn("log", "log"),
      key("π", "constant", "function", "pi"),
      key("e", "constant", "function", "e"),
      fn("√", "sqrt"),
      fn("x²", "square"),
      fn("x³", "cube"),
      fn("eˣ", "exp"),
      key("xʸ", "operator", "function", "^"),
      fn("n!", "factorial"),
      fn("|x|", "abs"),
      fn("1/x", "inv"),
      key("(", "operator", "function"),
      key(")", "operator", "function"),
    ],
    hexRow: ["A", "B", "C", "D", "E", "F"].map((char) =>
      key(char, "digit", "function"),
    ),
    bitwise: ["AND", "OR", "XOR", "NOT", "LSH", "RSH"].map((name) =>
      key(name, "bitwise", "compact"),
    ),
    padProgrammer: [
      utility("C", "clear"),
      utility("⌫", "back"),
      operator("÷"),
      operator("×"),
      digit("7"),
      digit("8"),
      digit("9"),
      operator("−"),
      digit("4"),
      digit("5"),
      digit("6"),
      operator("+"),
      digit("1"),
      digit("2"),
      digit("3"),
      key("=", "equals", "equals", "=", "row-span-2"),
      digit("0", "col-span-3"),
    ],
  });

  const BITWISE_SYMBOLS = Object.freeze({
    AND: "&",
    OR: "|",
    XOR: "^",
    LSH: "<<",
    RSH: ">>",
  });
  const KEYBOARD_OPERATORS = Object.freeze({
    "+": "+",
    "-": "−",
    "*": "×",
    "/": "÷",
    "(": "(",
    ")": ")",
    "^": "^",
  });
  const PROGRAMMER_KEYBOARD_OPERATORS = Object.freeze({ "&": "&", "|": "|" });
  const TRAILING_OPERATORS = /[+\u2212\u00D7\u00F7^&|<>*\/-]+$/;

  /* ---------- Application ---------- */

  class CalculatorApp {
    static #CALCULATOR_MODES = Object.freeze([
      "simple",
      "engineering",
      "programming",
    ]);

    #i18n = new I18n();
    #history = new HistoryStore();
    #historyDialog;
    #plotter;
    #panels = new Map();
    #sessions = new Map(
      CalculatorApp.#CALCULATOR_MODES.map((mode) => [
        mode,
        { expression: "0", waiting: false, historyLine: "" },
      ]),
    );
    #mode = "simple";
    #base = 16;
    #degrees = true;
    #errorTimer = 0;

    init() {
      this.#cachePanels();
      this.#renderKeypads();
      this.#plotter = new GraphPlotter(this.#i18n);
      this.#historyDialog = new HistoryDialog({
        dialog: document.getElementById("history-dialog"),
        list: document.getElementById("history-list"),
        store: this.#history,
        i18n: this.#i18n,
        onSelect: (result) => this.#useHistoryResult(result),
      });
      this.#bindEvents();
      this.#updateProgrammerKeys();
      this.#switchMode("simple");
      this.#i18n.init();
    }

    get #session() {
      return this.#sessions.get(this.#mode);
    }

    #cachePanels() {
      for (const mode of CalculatorApp.#CALCULATOR_MODES) {
        const root = document.querySelector(`[data-panel="${mode}"]`);
        this.#panels.set(mode, {
          root,
          display: root.querySelector("[data-display]"),
          historyLine: root.querySelector("[data-history]"),
          baseOutputs: [...root.querySelectorAll("[data-base-out]")],
        });
      }
    }

    #renderKeypads() {
      for (const container of document.querySelectorAll("[data-keys]")) {
        const layout = KEY_LAYOUTS[container.dataset.keys];
        container.replaceChildren(
          ...layout.map((definition) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className =
              `${KEY_STYLES[definition.kind]} ${definition.className}`.trim();
            button.textContent = definition.label;
            button.dataset.action = definition.action;
            button.dataset.value = definition.value;
            return button;
          }),
        );
      }
    }

    #bindEvents() {
      document.addEventListener("click", (event) => {
        const tab = event.target.closest('[role="tab"][data-mode]');
        if (tab) return this.#switchMode(tab.dataset.mode);

        const button = event.target.closest("button[data-action]");
        if (button && !button.disabled)
          this.#dispatch(button.dataset.action, button.dataset.value);
      });

      document.addEventListener("change", (event) => {
        if (event.target.name === "angle")
          this.#degrees = event.target.value === "deg";
        if (event.target.name === "base")
          this.#changeBase(Number.parseInt(event.target.value, 10));
      });

      document.addEventListener("keydown", (event) => this.#onKeydown(event));
      window.addEventListener("languageChanged", () =>
        window.location.reload(),
      );
    }

    #switchMode(mode) {
      this.#mode = mode;

      for (const tab of document.querySelectorAll('[role="tab"][data-mode]')) {
        tab.setAttribute("aria-selected", String(tab.dataset.mode === mode));
      }
      for (const panel of document.querySelectorAll("[data-panel]")) {
        panel.hidden = panel.dataset.panel !== mode;
      }

      if (mode === "graph") this.#plotter.refresh();
      else this.#renderDisplay();
    }

    #dispatch(action, value) {
      switch (action) {
        case "plot":
          return this.#plotter.draw();
        case "clear-graph":
          return this.#plotter.clear();
        case "example":
          return this.#plotter.setFunction(value);
        case "history":
          return this.#historyDialog.open();
        case "close-history":
          return this.#historyDialog.close();
        case "clear-history":
          return this.#historyDialog.clear();
        default:
          return this.#runCalculatorAction(action, value);
      }
    }

    #runCalculatorAction(action, value) {
      if (!this.#session) return;
      clearTimeout(this.#errorTimer);

      try {
        switch (action) {
          case "digit":
            this.#appendDigit(value);
            break;
          case "operator":
            this.#appendOperator(value);
            break;
          case "constant":
            this.#appendConstant(value);
            break;
          case "function":
            this.#applyFunction(value);
            break;
          case "bitwise":
            this.#applyBitwise(value);
            break;
          case "clear":
            this.#clear();
            break;
          case "back":
            this.#deleteLast();
            break;
          case "percent":
            this.#percentage();
            break;
          case "equals":
            this.#calculate();
            break;
          default:
            return;
        }
        this.#renderDisplay();
      } catch (error) {
        console.debug("Calculator error:", error);
        this.#showError();
      }
    }

    /* ----- input ----- */

    #appendDigit(char) {
      const session = this.#session;

      if (this.#mode === "programming") {
        if (!ProgrammerEvaluator.isValidDigit(char, this.#base)) return;
      } else if (
        char === "." &&
        /[\d.]*$/.exec(session.expression)[0].includes(".") &&
        !session.waiting
      ) {
        return;
      }

      if (session.waiting) {
        session.expression = char === "." ? "0." : char;
        session.waiting = false;
      } else if (session.expression === "0" && char !== ".") {
        session.expression = char;
      } else {
        session.expression += char;
      }
    }

    #appendOperator(symbol) {
      const session = this.#session;
      session.waiting = false;

      if (symbol === "(") {
        session.expression =
          session.expression === "0" ? "(" : `${session.expression}(`;
      } else if (symbol === ")") {
        session.expression += ")";
      } else {
        session.expression =
          session.expression.replace(TRAILING_OPERATORS, "") + symbol;
      }
    }

    #appendConstant(name) {
      const session = this.#session;
      const symbol = name === "pi" ? "π" : "e";

      session.expression =
        session.expression === "0" || session.waiting
          ? symbol
          : session.expression + symbol;
      session.waiting = false;
    }

    #clear() {
      Object.assign(this.#session, {
        expression: "0",
        waiting: false,
        historyLine: "",
      });
    }

    #deleteLast() {
      const session = this.#session;
      session.expression =
        session.expression.length > 1 ? session.expression.slice(0, -1) : "0";
      session.waiting = false;
    }

    /* ----- evaluation ----- */

    #evaluateStandard(expression) {
      const value = ExpressionEvaluator.evaluate(expression, {
        degrees: this.#degrees,
      });
      if (!Number.isFinite(value))
        throw new RangeError("Result is not a finite number");
      return value;
    }

    #evaluateProgrammer(expression) {
      return ProgrammerEvaluator.evaluate(
        expression.replace(TRAILING_OPERATORS, ""),
        this.#base,
      );
    }

    static #format(value) {
      return String(Number(value.toPrecision(12)));
    }

    #formatBig(value, base = this.#base) {
      return value.toString(base).toUpperCase();
    }

    #commit(historyExpression, resultText) {
      const session = this.#session;

      this.#history.add({
        expression: historyExpression,
        result: resultText,
        timestamp: new Date().toLocaleString(
          this.#i18n.lang === "fa" ? "fa-IR" : "en-US",
        ),
      });

      session.historyLine = `${historyExpression} =`;
      session.expression = resultText;
      session.waiting = true;
    }

    #calculate() {
      const { expression } = this.#session;

      if (this.#mode === "programming") {
        this.#commit(
          expression,
          this.#formatBig(this.#evaluateProgrammer(expression)),
        );
      } else {
        this.#commit(
          expression,
          CalculatorApp.#format(this.#evaluateStandard(expression)),
        );
      }
    }

    #percentage() {
      if (this.#mode === "programming") return;
      const { expression } = this.#session;
      this.#commit(
        `${expression}%`,
        CalculatorApp.#format(this.#evaluateStandard(expression) / 100),
      );
    }

    #applyFunction(name) {
      if (this.#mode === "programming") return;

      const { expression } = this.#session;
      const result = KEY_FUNCTIONS[name](
        this.#evaluateStandard(expression),
        this.#degrees,
      );
      if (!Number.isFinite(result))
        throw new RangeError("Result is not a finite number");

      this.#commit(`${name}(${expression})`, CalculatorApp.#format(result));
    }

    #applyBitwise(name) {
      const session = this.#session;

      if (name === "NOT") {
        const value = this.#evaluateProgrammer(session.expression);
        this.#commit(`NOT ${session.expression}`, this.#formatBig(~value));
        return;
      }
      this.#appendOperator(BITWISE_SYMBOLS[name]);
    }

    #useHistoryResult(result) {
      if (!this.#session) return;
      Object.assign(this.#session, {
        expression: String(result),
        waiting: true,
        historyLine: "",
      });
      this.#renderDisplay();
    }

    /* ----- programmer mode ----- */

    #changeBase(newBase) {
      const session = this.#sessions.get("programming");

      try {
        const value = ProgrammerEvaluator.evaluate(
          session.expression.replace(TRAILING_OPERATORS, ""),
          this.#base,
        );
        session.expression = this.#formatBig(value, newBase);
      } catch {
        session.expression = "0";
      }

      this.#base = newBase;
      session.waiting = false;
      this.#updateProgrammerKeys();
      this.#renderDisplay("programming");
    }

    #updateProgrammerKeys() {
      const root = this.#panels.get("programming").root;
      for (const button of root.querySelectorAll(
        'button[data-action="digit"]',
      )) {
        button.disabled = !ProgrammerEvaluator.isValidDigit(
          button.dataset.value,
          this.#base,
        );
      }
    }

    /* ----- rendering ----- */

    #renderDisplay(mode = this.#mode) {
      const panel = this.#panels.get(mode);
      const session = this.#sessions.get(mode);
      if (!panel) return;

      panel.display.value = session.expression;
      panel.display.scrollLeft = panel.display.scrollWidth;
      panel.historyLine.textContent = session.historyLine;

      if (mode === "programming")
        this.#renderBaseOutputs(panel, session.expression);
    }

    #renderBaseOutputs(panel, expression) {
      let value = null;
      try {
        value = this.#evaluateProgrammer(expression);
      } catch {
        // Incomplete expression: show placeholders
      }

      for (const output of panel.baseOutputs) {
        output.textContent =
          value === null
            ? "—"
            : this.#formatBig(value, Number(output.dataset.baseOut));
      }
    }

    #showError() {
      const session = this.#session;
      const panel = this.#panels.get(this.#mode);

      Object.assign(session, {
        expression: "0",
        waiting: false,
        historyLine: "",
      });
      panel.display.value = this.#i18n.s("error");
      this.#errorTimer = setTimeout(() => this.#renderDisplay(), 1500);
    }

    /* ----- keyboard ----- */

    #onKeydown(event) {
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return;
      if (!this.#session || this.#historyDialog.isOpen) return;
      if (event.target.closest?.("input:not([readonly]), textarea, select"))
        return;

      const { key: pressed } = event;
      const onButton = Boolean(event.target.closest?.("button"));

      if (/^[0-9.]$/.test(pressed)) {
        this.#runCalculatorAction("digit", pressed);
      } else if (this.#mode === "programming" && /^[a-f]$/i.test(pressed)) {
        this.#runCalculatorAction("digit", pressed.toUpperCase());
      } else if (KEYBOARD_OPERATORS[pressed]) {
        this.#runCalculatorAction("operator", KEYBOARD_OPERATORS[pressed]);
      } else if (
        this.#mode === "programming" &&
        PROGRAMMER_KEYBOARD_OPERATORS[pressed]
      ) {
        this.#runCalculatorAction(
          "operator",
          PROGRAMMER_KEYBOARD_OPERATORS[pressed],
        );
      } else if (pressed === "Enter" && !onButton) {
        event.preventDefault();
        this.#runCalculatorAction("equals");
      } else if (pressed === "Escape") {
        this.#runCalculatorAction("clear");
      } else if (pressed === "Backspace") {
        event.preventDefault();
        this.#runCalculatorAction("back");
      }
    }
  }

  new CalculatorApp().init();
})();
