const form = document.getElementById('warranty-form');
const reminderText = document.getElementById('reminder-text');
const list = document.getElementById('warranty-list');
const cancelBtn = document.getElementById('cancel-edit');

let warranties = JSON.parse(localStorage.getItem('warranties') || '[]');
let editingId = null;

const renderReminder = () => {
  if (!warranties.length) {
    reminderText.textContent = 'هنوز هیچ ضمانت‌نامه‌ای ثبت نشده است.';
    return;
  }

  const now = Date.now();
  const soonest = warranties
    .map(item => {
      const expiresAt = new Date(item.purchaseDate);
      expiresAt.setMonth(expiresAt.getMonth() + Number(item.duration));
      return { ...item, expiresAt };
    })
    .sort((a, b) => a.expiresAt - b.expiresAt)[0];

  const diff = soonest.expiresAt - now;
  const daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  reminderText.textContent = `${soonest.product} فقط ${daysLeft} روز تا پایان گارانتی باقی مانده.`;
};

const persist = () => {
  localStorage.setItem('warranties', JSON.stringify(warranties));
  renderWarranties();
  renderReminder();
};

const resetForm = () => {
  form.reset();
  editingId = null;
  cancelBtn.disabled = true;
};

const renderWarranties = () => {
  list.innerHTML = '';
  if (!warranties.length) {
    list.innerHTML = '<p class="empty">لیستی موجود نیست.</p>';
    return;
  }

  warranties.forEach(item => {
    const card = document.createElement('article');
    card.className = 'warranty-card';
    const expiresAt = new Date(item.purchaseDate);
    expiresAt.setMonth(expiresAt.getMonth() + Number(item.duration));
    const options = { year: 'numeric', month: 'long', day: 'numeric' };

    card.innerHTML = `
      <div class="card-meta">
        <span>کالا: ${item.product}</span>
        <span>تا: ${expiresAt.toLocaleDateString('fa-IR', options)}</span>
      </div>
      <div class="card-meta">
        <span>خرید: ${new Date(item.purchaseDate).toLocaleDateString('fa-IR', options)}</span>
        <span>مدت گارانتی: ${item.duration} ماه</span>
      </div>
      <div class="card-actions">
        <button class="edit">ویرایش</button>
        <button class="remove">حذف</button>
      </div>
    `;

    const [editBtn, removeBtn] = card.querySelectorAll('button');
    editBtn.addEventListener('click', () => {
      editingId = item.id;
      form.product.value = item.product;
      form.purchaseDate.value = item.purchaseDate;
      form.duration.value = item.duration;
      cancelBtn.disabled = false;
    });

    removeBtn.addEventListener('click', () => {
      warranties = warranties.filter(entry => entry.id !== item.id);
      persist();
    });

    list.appendChild(card);
  });
};

form.addEventListener('submit', event => {
  event.preventDefault();
  const payload = {
    product: form.product.value.trim(),
    purchaseDate: form.purchaseDate.value,
    duration: form.duration.value,
    id: editingId || crypto.randomUUID()
  };

  const existingIndex = warranties.findIndex(entry => entry.id === payload.id);
  if (existingIndex > -1) {
    warranties[existingIndex] = payload;
  } else {
    warranties.push(payload);
  }

  persist();
  resetForm();
});

cancelBtn.addEventListener('click', resetForm);

cancelBtn.disabled = true;
renderWarranties();
renderReminder();

