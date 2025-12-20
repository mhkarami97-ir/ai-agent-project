const STORAGE_KEY = "medicine-schedule";

const medicineForm = document.getElementById("medicine-form");
const medicineList = document.getElementById("medicine-list");
const listEmpty = document.getElementById("list-empty");
const totalCountEl = document.getElementById("total-count");
const upcomingCountEl = document.getElementById("upcoming-count");
const alertList = document.getElementById("alert-list");

let medicines = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

const renderMedicines = () => {
  medicineList.innerHTML = "";

  if (!medicines.length) {
    listEmpty.hidden = false;
    totalCountEl.textContent = "۰";
    upcomingCountEl.textContent = "۰";
    alertList.innerHTML = "";
    return;
  }

  listEmpty.hidden = true;
  totalCountEl.textContent = medicines.length;

  const now = new Date();
  const upcoming = medicines.filter((item) => {
    const [hour, minute] = item.time.split(":");
    const itemDate = new Date(now);
    itemDate.setHours(Number(hour), Number(minute), 0, 0);
    const delta = (itemDate - now) / 60000;
    return delta >= 0 && delta <= 30;
  });

  upcomingCountEl.textContent = upcoming.length;
  alertList.innerHTML = upcoming
    .map((item) => `<li class="alert-item">${item.name} – دقیقه ${Math.round((new Date().setHours(...item.time.split(":"), 0) - now) / 60000)} باقی‌ست.</li>`)
    .join("");

  medicines.forEach((item, index) => {
    const itemEl = document.createElement("li");
    itemEl.className = "medicine-item";
    itemEl.innerHTML = `
      <strong>${item.name}</strong>
      <p>${item.dose}</p>
      <div class="medicine-meta">
        <span>زمان: ${item.time}</span>
        <span>${item.note || "بدون یادداشت"}</span>
      </div>
      <div class="medicine-status">
        <button class="status-btn ${item.taken ? "active" : ""}" data-index="${index}" data-action="taken">خوردم</button>
        <button class="status-btn ${item.skipped ? "active" : ""}" data-index="${index}" data-action="skipped">نخوردم</button>
      </div>
    `;
    medicineList.appendChild(itemEl);
  });
};

const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(medicines));

medicineForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(medicineForm);
  const entry = {
    name: formData.get("name"),
    dose: formData.get("dose"),
    time: formData.get("time"),
    note: formData.get("note"),
    taken: false,
    skipped: false,
  };

  medicines.push(entry);
  persist();
  medicineForm.reset();
  renderMedicines();
});

medicineList.addEventListener("click", (event) => {
  if (!(event.target instanceof HTMLButtonElement)) return;
  const button = event.target;
  const index = Number(button.dataset.index);
  const action = button.dataset.action;

  if (!Number.isFinite(index)) return;

  medicines = medicines.map((item, itemIndex) => {
    if (itemIndex !== index) return item;
    return {
      ...item,
      taken: action === "taken" ? !item.taken : item.taken,
      skipped: action === "skipped" ? !item.skipped : item.skipped,
    };
  });

  persist();
  renderMedicines();
});

renderMedicines();

