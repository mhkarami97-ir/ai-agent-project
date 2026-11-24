// Checklist tool: state (ChecklistStore), i18n, toast, dialogs and the view layer are separate classes.
(() => {
  "use strict";

  const STORAGE_KEY = "localized-checklists-v1";
  const TOAST_DURATION_MS = 1700;
  const MAX_IMPORT_BYTES = 1_000_000;

  const createId = () =>
    crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* ---------- State (no DOM access) ---------- */

  class ChecklistStore {
    #lists = [];
    #activeListId = null;
    #defaultTitle;
    #untitled;

    constructor({ defaultTitle, untitled }) {
      this.#defaultTitle = defaultTitle;
      this.#untitled = untitled;
    }

    get lists() {
      return this.#lists;
    }

    get activeList() {
      return this.#lists.find((list) => list.id === this.#activeListId) ?? null;
    }

    load() {
      try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (Array.isArray(parsed?.lists)) {
          this.#lists = parsed.lists
            .map((raw) => this.#normalizeList(raw))
            .filter(Boolean);
        }
        this.#activeListId = parsed?.activeListId ?? null;
      } catch (error) {
        console.warn("failed to hydrate state", error);
      }
      this.#ensureValidState();
    }

    setActive(listId) {
      this.#activeListId = listId;
      this.#save();
    }

    addList(title) {
      const list = this.#createList(title);
      this.#lists.push(list);
      this.#activeListId = list.id;
      this.#save();
      return list;
    }

    deleteActiveList() {
      this.#lists = this.#lists.filter(
        (list) => list.id !== this.#activeListId,
      );
      this.#activeListId = null;
      this.#ensureValidState();
      this.#save();
    }

    addItem(title) {
      this.activeList.items.push(this.#createItem(title));
      this.#save();
    }

    setCompleted(itemId, completed) {
      const item = this.#findItem(itemId);
      if (!item) return;
      item.completed = completed;
      this.#save();
    }

    renameItem(itemId, title) {
      const item = this.#findItem(itemId);
      if (!item) return;
      item.title = title;
      this.#save();
    }

    deleteItem(itemId) {
      const list = this.activeList;
      list.items = list.items.filter((item) => item.id !== itemId);
      this.#save();
    }

    clearItems() {
      this.activeList.items = [];
      this.#save();
    }

    /** @returns {number} how many items were restored */
    revertCompleted() {
      const completed = this.activeList.items.filter((item) => item.completed);
      for (const item of completed) item.completed = false;
      if (completed.length > 0) this.#save();
      return completed.length;
    }

    /**
     * Merge lists coming from a file. A list with a known id replaces that list,
     * any other list is appended. Returns how many lists were imported.
     */
    importLists(rawLists) {
      const imported = rawLists
        .map((raw) => this.#normalizeList(raw))
        .filter(Boolean);
      if (imported.length === 0) throw new TypeError("No valid list found");

      for (const list of imported) {
        const index = this.#lists.findIndex(
          (existing) => existing.id === list.id,
        );
        if (index === -1) this.#lists.push(list);
        else this.#lists[index] = list;
      }
      this.#activeListId = imported[0].id;
      this.#save();
      return imported.length;
    }

    #ensureValidState() {
      if (this.#lists.length === 0)
        this.#lists.push(this.#createList(this.#defaultTitle));
      if (!this.activeList) this.#activeListId = this.#lists[0].id;
    }

    #findItem(itemId) {
      return this.activeList?.items.find((item) => item.id === itemId) ?? null;
    }

    #createList(title) {
      return { id: createId(), title, items: [], createdAt: Date.now() };
    }

    #createItem(title) {
      return { id: createId(), title, completed: false };
    }

    #normalizeList(raw) {
      if (!raw || typeof raw !== "object") return null;
      return {
        id: typeof raw.id === "string" && raw.id ? raw.id : createId(),
        title: String(raw.title ?? "").trim() || this.#untitled,
        items: Array.isArray(raw.items)
          ? raw.items.map((item) => this.#normalizeItem(item)).filter(Boolean)
          : [],
        createdAt: Number(raw.createdAt) || Date.now(),
      };
    }

    #normalizeItem(raw) {
      if (!raw || typeof raw !== "object") return null;
      return {
        id: typeof raw.id === "string" && raw.id ? raw.id : createId(),
        title: String(raw.title ?? "").trim() || this.#untitled,
        completed: Boolean(raw.completed),
      };
    }

    #save() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          lists: this.#lists,
          activeListId: this.#activeListId,
        }),
      );
    }
  }

  /* ---------- Services ---------- */

  class I18n {
    #translations = {};
    #lang = localStorage.getItem("lang") || "fa";

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

      const titleKey = document.querySelector("title")?.dataset.i18n;
      if (titleKey) document.title = this.t(titleKey);
    }
  }

  class Toast {
    #element;
    #timer = 0;

    constructor(element) {
      this.#element = element;
    }

    show(message, duration = TOAST_DURATION_MS) {
      clearTimeout(this.#timer);
      this.#element.textContent = message;
      this.#element.hidden = false;
      this.#timer = setTimeout(() => {
        this.#element.hidden = true;
      }, duration);
    }
  }

  /** Promise-based replacement for window.confirm / window.prompt, built on <dialog>. */
  class DialogService {
    #dialog;
    #title;
    #message;
    #input;
    #confirmButton;

    constructor(dialog) {
      this.#dialog = dialog;
      this.#title = dialog.querySelector("#dialogTitle");
      this.#message = dialog.querySelector("#dialogMessage");
      this.#input = dialog.querySelector("#dialogInput");
      this.#confirmButton = dialog.querySelector("#dialogConfirm");

      dialog
        .querySelector("#dialogCancel")
        .addEventListener("click", () => dialog.close("cancel"));
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close("cancel");
      });
    }

    async confirm({ title, message, confirmLabel, isDanger = false }) {
      this.#prepare({ title, message, confirmLabel, isDanger });
      return (await this.#open()) === "ok";
    }

    /** @returns {Promise<string|null>} the trimmed value, or null when cancelled */
    async prompt({ title, value, confirmLabel }) {
      this.#prepare({ title, confirmLabel, hasInput: true, value });
      const result = await this.#open();
      return result === "ok" ? this.#input.value.trim() : null;
    }

    #prepare({
      title,
      message = "",
      confirmLabel,
      isDanger = false,
      hasInput = false,
      value = "",
    }) {
      this.#title.textContent = title;
      this.#message.textContent = message;
      this.#message.hidden = message === "";
      this.#input.hidden = !hasInput;
      this.#input.required = hasInput;
      this.#input.value = value;
      this.#confirmButton.textContent = confirmLabel;
      this.#confirmButton.classList.toggle("btn--danger", isDanger);
      this.#confirmButton.classList.toggle("btn--primary", !isDanger);
    }

    #open() {
      return new Promise((resolve) => {
        this.#dialog.addEventListener(
          "close",
          () => resolve(this.#dialog.returnValue),
          { once: true },
        );
        this.#dialog.returnValue = "";
        this.#dialog.showModal();
        if (!this.#input.hidden) {
          this.#input.focus();
          this.#input.select();
        }
      });
    }
  }

  /* ---------- Application ---------- */

  const ICONS = Object.freeze({
    edit: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    remove:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>',
  });

  class ChecklistApp {
    #i18n = new I18n();
    #store;
    #toast;
    #dialogs;
    #dom;

    async init() {
      this.#cacheDom();
      await this.#i18n.load();

      this.#store = new ChecklistStore({
        defaultTitle: this.#i18n.t("default_list"),
        untitled: this.#i18n.t("untitled"),
      });
      this.#store.load();
      this.#toast = new Toast(this.#dom.toast);
      this.#dialogs = new DialogService(this.#dom.dialog);

      this.#bindEvents();
      this.#render();
      window.addEventListener("languageChanged", () =>
        window.location.reload(),
      );
    }

    #cacheDom() {
      const byId = (id) => document.getElementById(id);
      this.#dom = {
        tabs: byId("listTabs"),
        activeTitle: byId("activeListTitle"),
        progressText: byId("progressText"),
        progress: byId("progress"),
        progressBar: byId("progressBar"),
        newListForm: byId("newListForm"),
        newListInput: byId("listTitleInput"),
        newItemForm: byId("newItemForm"),
        newItemInput: byId("newItemInput"),
        itemsList: byId("itemsList"),
        emptyState: byId("emptyState"),
        resetButton: byId("resetListButton"),
        revertButton: byId("revertCompletedButton"),
        deleteListButton: byId("deleteListButton"),
        downloadButton: byId("downloadListButton"),
        fileInput: byId("listFileInput"),
        uploadButton: byId("uploadFileButton"),
        toast: byId("toast"),
        dialog: byId("dialog"),
      };
    }

    #bindEvents() {
      const dom = this.#dom;

      dom.tabs.addEventListener("click", (event) => {
        const tab = event.target.closest('[role="tab"]');
        if (tab) this.#selectList(tab.dataset.id);
      });
      dom.tabs.addEventListener("keydown", (event) =>
        this.#onTabKeydown(event),
      );

      dom.newListForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const title = dom.newListInput.value.trim();
        if (!title) return;
        this.#store.addList(title);
        dom.newListInput.value = "";
        this.#render();
        this.#toast.show(this.#i18n.t("toast_list_added"));
      });

      dom.newItemForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const title = dom.newItemInput.value.trim();
        if (!title) return;
        this.#store.addItem(title);
        dom.newItemInput.value = "";
        this.#renderItems();
        dom.newItemInput.focus();
      });

      dom.itemsList.addEventListener("change", (event) => {
        const checkbox = event.target.closest('input[type="checkbox"]');
        if (!checkbox) return;
        this.#store.setCompleted(
          checkbox.closest("li").dataset.id,
          checkbox.checked,
        );
        this.#renderItems();
      });
      dom.itemsList.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        const itemId = button.closest("li").dataset.id;
        if (button.dataset.action === "edit") this.#editItem(itemId);
        else this.#deleteItem(itemId);
      });

      dom.resetButton.addEventListener("click", () => this.#clearItems());
      dom.revertButton.addEventListener("click", () => this.#revertCompleted());
      dom.deleteListButton.addEventListener("click", () => this.#deleteList());
      dom.downloadButton.addEventListener("click", () => this.#exportList());
      dom.uploadButton.addEventListener("click", () => this.#importFile());
    }

    /* ----- actions ----- */

    #selectList(listId) {
      this.#store.setActive(listId);
      this.#render();
    }

    #onTabKeydown(event) {
      const tabs = [...this.#dom.tabs.querySelectorAll('[role="tab"]')];
      const index = tabs.indexOf(event.target);
      if (index === -1) return;

      const isRtl = document.documentElement.dir === "rtl";
      let next = index;
      if (event.key === "ArrowRight") next = isRtl ? index - 1 : index + 1;
      else if (event.key === "ArrowLeft") next = isRtl ? index + 1 : index - 1;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;

      event.preventDefault();
      const target = tabs[(next + tabs.length) % tabs.length];
      this.#selectList(target.dataset.id);
      this.#dom.tabs
        .querySelector(`[data-id="${CSS.escape(target.dataset.id)}"]`)
        ?.focus();
    }

    async #editItem(itemId) {
      const item = this.#store.activeList.items.find(
        (entry) => entry.id === itemId,
      );
      if (!item) return;

      const title = await this.#dialogs.prompt({
        title: this.#i18n.t("dialog_edit_title"),
        value: item.title,
        confirmLabel: this.#i18n.t("dialog_save"),
      });
      if (!title) return;

      this.#store.renameItem(itemId, title);
      this.#renderItems();
      this.#toast.show(this.#i18n.t("toast_title_saved"));
    }

    #deleteItem(itemId) {
      this.#store.deleteItem(itemId);
      this.#renderItems();
    }

    async #clearItems() {
      const isConfirmed = await this.#dialogs.confirm({
        title: this.#i18n.t("button_1"),
        message: this.#i18n.t("confirm_clear"),
        confirmLabel: this.#i18n.t("dialog_confirm"),
        isDanger: true,
      });
      if (!isConfirmed) return;

      this.#store.clearItems();
      this.#renderItems();
      this.#toast.show(this.#i18n.t("toast_items_cleared"));
    }

    #revertCompleted() {
      const count = this.#store.revertCompleted();
      if (count === 0) return;
      this.#renderItems();
      this.#toast.show(this.#i18n.t("toast_reverted"));
    }

    async #deleteList() {
      const isConfirmed = await this.#dialogs.confirm({
        title: this.#i18n.t("button_6"),
        message: this.#i18n.t("confirm_delete_list", {
          title: this.#store.activeList.title,
        }),
        confirmLabel: this.#i18n.t("dialog_confirm"),
        isDanger: true,
      });
      if (!isConfirmed) return;

      this.#store.deleteActiveList();
      this.#render();
      this.#toast.show(this.#i18n.t("toast_list_deleted"));
    }

    #exportList() {
      const list = this.#store.activeList;
      const blob = new Blob([JSON.stringify(list, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${list.title.replace(/[\\/:*?"<>|\s]+/g, "-") || "checklist"}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      this.#toast.show(this.#i18n.t("toast_exported"));
    }

    async #importFile() {
      const file = this.#dom.fileInput.files[0];
      if (!file) return this.#toast.show(this.#i18n.t("toast_no_file"));
      if (file.size > MAX_IMPORT_BYTES)
        return this.#toast.show(this.#i18n.t("toast_import_invalid"));

      try {
        const parsed = JSON.parse(await file.text());
        const count = this.#store.importLists(
          Array.isArray(parsed) ? parsed : [parsed],
        );
        this.#dom.fileInput.value = "";
        this.#render();
        this.#toast.show(this.#i18n.t("toast_imported", { count }));
      } catch (error) {
        console.warn("import failed", error);
        this.#toast.show(this.#i18n.t("toast_import_invalid"));
      }
    }

    /* ----- rendering ----- */

    #render() {
      this.#renderTabs();
      this.#renderItems();
    }

    #renderTabs() {
      const activeId = this.#store.activeList.id;

      this.#dom.tabs.replaceChildren(
        ...this.#store.lists.map((list) => {
          const tab = document.createElement("button");
          const isActive = list.id === activeId;
          tab.type = "button";
          tab.className = "tab";
          tab.setAttribute("role", "tab");
          tab.dataset.id = list.id;
          tab.textContent = list.title;
          tab.setAttribute("aria-selected", String(isActive));
          tab.tabIndex = isActive ? 0 : -1;
          return tab;
        }),
      );
    }

    #renderItems() {
      const list = this.#store.activeList;
      const dom = this.#dom;
      const total = list.items.length;
      const done = list.items.filter((item) => item.completed).length;

      dom.activeTitle.textContent = list.title;
      dom.emptyState.hidden = total > 0;
      dom.progress.hidden = total === 0;
      dom.progressText.hidden = total === 0;
      dom.progressText.textContent = this.#i18n.t("progress", { done, total });
      dom.progressBar.style.width =
        total === 0 ? "0%" : `${Math.round((done / total) * 100)}%`;
      dom.progress.setAttribute("aria-valuenow", String(done));
      dom.progress.setAttribute("aria-valuemax", String(total));

      dom.resetButton.disabled = total === 0;
      dom.revertButton.disabled = done === 0;

      dom.itemsList.replaceChildren(
        ...list.items.map((item) => this.#createItemElement(item)),
      );
    }

    #createItemElement(item) {
      const row = document.createElement("li");
      row.className = item.completed ? "todo-item is-done" : "todo-item";
      row.dataset.id = item.id;

      const label = document.createElement("label");
      label.className = "todo-label";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "checkbox";
      checkbox.checked = item.completed;

      const title = document.createElement("span");
      title.className = "todo-title";
      title.textContent = item.title;

      label.append(checkbox, title);

      const actions = document.createElement("div");
      actions.className = "todo-actions";
      actions.append(
        this.#createIconButton("edit", ICONS.edit, "button_7"),
        this.#createIconButton("delete", ICONS.remove, "button_8"),
      );

      row.append(label, actions);
      return row;
    }

    #createIconButton(action, icon, labelKey) {
      const button = document.createElement("button");
      const label = this.#i18n.t(labelKey);
      button.type = "button";
      button.className = "btn btn--ghost btn--icon";
      button.dataset.action = action;
      button.title = label;
      button.setAttribute("aria-label", label);
      button.innerHTML = icon;
      return button;
    }
  }

  new ChecklistApp().init();
})();
