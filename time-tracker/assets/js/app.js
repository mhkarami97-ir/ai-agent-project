const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const reportList = document.getElementById('report-list');

const STORAGE_KEY = 'fh-time-tracker:tasks';

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const getActiveTaskMarkup = (task) => `
  <div class="task-card" data-id="${task.id}">
    <div class="task-card-header">
      <div>
        <h3>${task.title}</h3>
        <p>${task.category || 'بدون دسته‌بندی'} · ${formatDuration(task.total)}</p>
      </div>
      <span>${task.status === 'running' ? 'در حال اجرا' : 'متوقف'}</span>
    </div>
    <div class="task-actions">
      <button class="button-secondary" data-action="toggle">${task.status === 'running' ? 'توقف' : 'شروع'}</button>
      <button class="button-secondary" data-action="edit">ویرایش</button>
      <button class="button-danger" data-action="delete">حذف</button>
    </div>
  </div>
`;

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}س ${minutes.toString().padStart(2, '0')}د ${secs
    .toString()
    .padStart(2, '0')}ث`;
};

const updateView = () => {
  if (!tasks.length) {
    taskList.innerHTML = '<p>فعلاً کاری ثبت نشده است.</p>';
  } else {
    taskList.innerHTML = tasks.map(getActiveTaskMarkup).join('');
  }

  if (!tasks.length) {
    reportList.innerHTML = '<p>هیچ گزارشی موجود نیست.</p>';
  } else {
    const grouped = tasks.reduce((acc, task) => {
      const dateKey = new Date(task.createdAt).toLocaleDateString('fa-IR');
      acc[dateKey] = acc[dateKey] || 0;
      acc[dateKey] += task.total;
      return acc;
    }, {});

    reportList.innerHTML = Object.entries(grouped)
      .map(
        ([date, total]) => `
      <div class="report-card">
        <p>تاریخ: ${date}</p>
        <p>کل زمان: <span>${formatDuration(total)}</span></p>
      </div>
    `
      )
      .join('');
  }
};

const persist = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

const handleToggle = (taskId) => {
  tasks = tasks.map((task) => {
    if (task.id !== taskId) return task;

    if (task.status === 'running') {
      const now = Date.now();
      return {
        ...task,
        status: 'paused',
        total: task.total + Math.floor((now - task.startedAt) / 1000),
      };
    }

    return {
      ...task,
      status: 'running',
      startedAt: Date.now(),
    };
  });

  persist();
  updateView();
};

const handleDelete = (taskId) => {
  tasks = tasks.filter((task) => task.id !== taskId);
  persist();
  updateView();
};

const handleEdit = (taskId) => {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;

  const newTitle = prompt('عنوان جدید را وارد کنید', task.title);
  if (newTitle === null) return;

  const newCategory = prompt('دسته‌بندی جدید را وارد کنید', task.category || '');
  tasks = tasks.map((item) =>
    item.id === taskId ? { ...item, title: newTitle.trim() || item.title, category: newCategory.trim() } : item
  );

  persist();
  updateView();
};

taskList.addEventListener('click', (event) => {
  const action = event.target.dataset.action;
  const taskId = event.target.closest('.task-card')?.dataset.id;
  if (!action || !taskId) return;

  if (action === 'toggle') handleToggle(taskId);
  if (action === 'delete') handleDelete(taskId);
  if (action === 'edit') handleEdit(taskId);
});

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = document.getElementById('task-title').value.trim();
  const category = document.getElementById('task-category').value.trim();

  const newTask = {
    id: crypto.randomUUID(),
    title,
    category,
    total: 0,
    status: 'paused',
    createdAt: Date.now(),
    startedAt: null,
  };

  tasks = [newTask, ...tasks];
  persist();
  updateView();
  taskForm.reset();
});

const hydrateTimers = () => {
  tasks = tasks.map((task) => {
    if (task.status !== 'running') return task;

    const elapsed = Math.floor((Date.now() - task.startedAt) / 1000);
    return { ...task, total: task.total + elapsed, startedAt: Date.now() - elapsed * 1000 };
  });
};

setInterval(() => {
  tasks = tasks.map((task) => {
    if (task.status !== 'running') return task;

    const elapsed = Math.floor((Date.now() - task.startedAt) / 1000);
    return { ...task, total: task.total + elapsed, startedAt: Date.now() - elapsed * 1000 };
  });

  updateView();
}, 1000);

hydrateTimers();
updateView();

