const STORAGE_KEY = 'localized-checklists-v1';

const dom = {
  tabs: document.getElementById('listTabs'),
  activeTitle: document.getElementById('activeListTitle'),
  newListForm: document.getElementById('newListForm'),
  newListInput: document.getElementById('listTitleInput'),
  newItemForm: document.getElementById('newItemForm'),
  newItemInput: document.getElementById('newItemInput'),
  itemsList: document.getElementById('itemsList'),
  emptyState: document.getElementById('emptyState'),
  resetButton: document.getElementById('resetListButton'),
  revertButton: document.getElementById('revertCompletedButton'),
  downloadButton: document.getElementById('downloadListButton'),
  fileInput: document.getElementById('listFileInput'),
  uploadButton: document.getElementById('uploadFileButton'),
  toast: document.getElementById('toast'),
};

const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 7));

const createList = (title) => ({
  id: uuid(),
  title,
  items: [],
  createdAt: Date.now(),
});

const createItem = (title) => ({
  id: uuid(),
  title,
  completed: false,
});

const state = {
  lists: [],
  activeListId: null,
};

const notify = (message, duration = 1700) => {
  dom.toast.textContent = message;
  dom.toast.style.display = 'block';
  setTimeout(() => {
    dom.toast.style.display = 'none';
  }, duration);
};

const persist = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const loadState = () => {
  const payload = localStorage.getItem(STORAGE_KEY);
  if (!payload) return;
  try {
    const parsed = JSON.parse(payload);
    if (Array.isArray(parsed.lists)) {
      state.lists = parsed.lists;
    }
    state.activeListId = parsed.activeListId ?? null;
  } catch (error) {
    console.warn('failed to hydrate state', error);
  }
};

const getActiveList = () => state.lists.find((list) => list.id === state.activeListId);

const renderTabs = () => {
  dom.tabs.innerHTML = '';
  state.lists.forEach((list) => {
    const button = document.createElement('button');
    button.className = 'list-tab';
    button.type = 'button';
    button.textContent = list.title;
    if (list.id === state.activeListId) {
      button.classList.add('active');
    }
    button.addEventListener('click', () => {
      setActiveList(list.id);
    });
    dom.tabs.appendChild(button);
  });
};

const renderList = () => {
  const active = getActiveList();
  dom.itemsList.innerHTML = '';
  if (!active) {
    dom.emptyState.style.display = 'block';
    dom.activeTitle.textContent = 'یک دسته را انتخاب کنید';
    return;
  }
  dom.emptyState.style.display = active.items.length ? 'none' : 'block';
  dom.activeTitle.textContent = active.title;
  active.items.forEach((item) => {
    const row = document.createElement('li');
    row.className = 'item-row';
    if (item.completed) {
      row.classList.add('completed');
    }
    const title = document.createElement('p');
    title.className = 'item-title';
    if (item.completed) {
      title.classList.add('completed');
    }
    title.textContent = item.title;
    row.appendChild(title);

    const status = document.createElement('span');
    status.className = 'status-badge';
    status.textContent = item.completed ? 'انجام شد' : 'در جریان';
    row.appendChild(status);

    const actions = document.createElement('div');
    actions.className = 'item-actions';

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.textContent = item.completed ? 'برگرداندن' : 'تمام شد';
    toggleButton.addEventListener('click', () => {
      item.completed = !item.completed;
      renderList();
      persist();
    });
    actions.appendChild(toggleButton);

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.textContent = 'ویرایش';
    editButton.addEventListener('click', () => editItem(item.id));
    actions.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'حذف';
    deleteButton.addEventListener('click', () => deleteItem(item.id));
    actions.appendChild(deleteButton);

    row.appendChild(actions);
    dom.itemsList.appendChild(row);
  });
};

const setActiveList = (listId) => {
  state.activeListId = listId;
  renderTabs();
  renderList();
  persist();
};

const createListAndActivate = (title) => {
  const newList = createList(title);
  state.lists.push(newList);
  setActiveList(newList.id);
  notify('دسته جدید اضافه شد');
};

const deleteItem = (itemId) => {
  const active = getActiveList();
  if (!active) return;
  active.items = active.items.filter((item) => item.id !== itemId);
  renderList();
  persist();
};

const editItem = (itemId) => {
  const active = getActiveList();
  if (!active) return;
  const item = active.items.find((entry) => entry.id === itemId);
  if (!item) return;
  const updated = prompt('عنوان جدید را وارد کنید', item.title);
  if (updated && updated.trim()) {
    item.title = updated.trim();
    persist();
    renderList();
    notify('عنوان ذخیره شد');
  }
};

const resetList = () => {
  const active = getActiveList();
  if (!active) return;
  active.items = [];
  renderList();
  persist();
  notify('در این دسته همه آیتم ها پاک شدند');
};

const revertCompleted = () => {
  const active = getActiveList();
  if (!active || !active.items.length) return;
  const modified = active.items.some((item) => item.completed);
  if (!modified) {
    notify('آیتم انجام شده ای برای بازگرداندن وجود ندارد');
    return;
  }
  active.items.forEach((item) => {
    item.completed = false;
  });
  renderList();
  persist();
  notify('تمام آیتم‌های انجام شده به در حال انجام برگردانده شدند');
};

const exportState = () => {
  const active = getActiveList();
  if (!active) {
    notify('ابتدا یک دسته انتخاب کنید');
    return;
  }
  const json = JSON.stringify(active, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${active.title.replace(/\s+/g, '-') || 'checklist'}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  notify('خروجی لیست آماده و دانلود شد');
};

const importLists = () => {
  const payload = dom.fileInput.files[0];
  if (!payload) {
    notify('فایلی برای واردسازی انتخاب نشده');
    return;
  }
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);
      const lists = Array.isArray(parsed) ? parsed : [parsed];
      if (!lists.length || !lists.every((list) => list && typeof list === 'object')) {
        throw new Error('ساختار غیرفعال');
      }
      state.lists = lists.map((list) => ({
        ...list,
        id: list.id || uuid(),
        items: Array.isArray(list.items)
          ? list.items.map((item) => ({
              id: item.id || uuid(),
              title: item.title || 'بدون عنوان',
              completed: Boolean(item.completed),
            }))
          : [],
      }));
      state.activeListId = state.lists[0] ? state.lists[0].id : null;
      renderTabs();
      renderList();
      persist();
      notify('اطلاعات جایگزین شدند');
    } catch (error) {
      notify('ساختار وارد شده معتبر نیست');
    }
  };
  reader.readAsText(payload);
};

const addItemToActive = (title) => {
  const active = getActiveList();
  if (!active) {
    notify('ابتدا یک دسته انتخاب کنید یا بسازید');
    return;
  }
  active.items.push(createItem(title));
  persist();
  renderList();
};

dom.newListForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = dom.newListInput.value.trim();
  if (!title) return;
  createListAndActivate(title);
  dom.newListInput.value = '';
});

dom.newItemForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = dom.newItemInput.value.trim();
  if (!value) return;
  addItemToActive(value);
  dom.newItemInput.value = '';
});

dom.resetButton.addEventListener('click', resetList);
dom.revertButton.addEventListener('click', revertCompleted);
dom.downloadButton.addEventListener('click', exportState);
dom.uploadButton.addEventListener('click', importLists);

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  if (!state.lists.length) {
    const defaultList = createList('لیست پیش‌فرض');
    state.lists.push(defaultList);
  }
  if (!state.activeListId && state.lists[0]) {
    state.activeListId = state.lists[0].id;
  }
  renderTabs();
  renderList();
  notify('آماده استفاده است');
});
