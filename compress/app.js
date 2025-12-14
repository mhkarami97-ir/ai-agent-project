const state = {
  files: [],
  results: new Map(), // name -> { blob }
};

const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');
const preview = document.getElementById('preview');
const compressBtn = document.getElementById('compressBtn');
const zipBtn = document.getElementById('zipBtn');
const summary = document.getElementById('summary');
const resetBtn = document.getElementById('resetBtn');
const clearBtn = document.getElementById('clearBtn');
const quality = document.getElementById('quality');
const qualityVal = document.getElementById('qualityVal');
const maxDim = document.getElementById('maxDim');
const format = document.getElementById('format');

quality.addEventListener('input', () => qualityVal.textContent = quality.value);

function formatBytes(bytes) {
  const units = ['B','KB','MB','GB'];
  let i = 0; let v = bytes;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return v.toFixed(v < 10 && i > 0 ? 2 : 0) + ' ' + units[i];
}

function updateSummary() {
  const count = state.files.length;
  const done = state.results.size;
  summary.textContent = `${count} فایل انتخاب شده — ${done} فشرده شده`;
  zipBtn.disabled = done === 0;
}

function addFiles(files) {
  const valid = Array.from(files).filter(f => /image\/(jpeg|png|webp|gif|bmp|tiff|svg|heic|heif)/i.test(f.type) || /\.(jpe?g|png|webp|gif|bmp|tiff|svg|heic|heif)$/i.test(f.name));
  state.files.push(...valid);
  renderPreview();
  updateSummary();
}

fileInput.addEventListener('change', (e) => addFiles(e.target.files));

// Drag & Drop
['dragenter','dragover'].forEach(ev => dropzone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropzone.classList.add('drag'); }));
['dragleave','drop'].forEach(ev => dropzone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropzone.classList.remove('drag'); }));
dropzone.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));

function renderPreview() {
  preview.innerHTML = '';
  state.files.forEach((file, idx) => {
    const url = URL.createObjectURL(file);
    const div = document.createElement('div');
    div.className = 'thumb';
    div.innerHTML = `
      <img src="${url}" alt="${file.name}" />
      <div class="meta">
        <span class="muted">${file.name}</span>
        <span>${formatBytes(file.size)}</span>
      </div>
      <div class="progress"><div id="progress-${idx}"></div></div>
      <div style="display:flex; gap:8px; padding:8px;">
        <button class="btn" data-action="download" data-index="${idx}">دانلود خروجی</button>
        <button class="btn" data-action="remove" data-index="${idx}">حذف</button>
      </div>
    `;
    preview.appendChild(div);
  });
  preview.querySelectorAll('button').forEach(btn => btn.addEventListener('click', onThumbAction));
}

function onThumbAction(e) {
  const idx = Number(e.currentTarget.getAttribute('data-index'));
  const act = e.currentTarget.getAttribute('data-action');
  const file = state.files[idx];
  if (!file) return;
  if (act === 'remove') {
    state.files.splice(idx, 1);
    state.results.delete(file.name);
    renderPreview(); updateSummary();
  } else if (act === 'download') {
    const res = state.results.get(file.name);
    if (!res) return alert('ابتدا فایل را فشرده‌سازی کنید.');
    const a = document.createElement('a');
    const ext = format.value === 'jpeg' ? 'jpg' : format.value;
    a.href = URL.createObjectURL(res.blob);
    a.download = file.name.replace(/\.[^.]+$/, '') + `.${ext}`;
    document.body.appendChild(a); a.click(); a.remove();
  }
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function getTargetSize(width, height, max) {
  if (!max || max <= 0) return { width, height };
  const scale = Math.min(max / width, max / height, 1);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

async function compressImage(file, opts) {
  const img = await readImage(file);
  const { width, height } = img;
  const { width: tw, height: th } = getTargetSize(width, height, opts.maxDim);
  const canvas = document.createElement('canvas');
  canvas.width = tw; canvas.height = th;
  const ctx = canvas.getContext('2d');
  // Basic draw; EXIF orientation handling for JPEGs is skipped for brevity
  ctx.drawImage(img, 0, 0, tw, th);

  const typeMap = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  const mime = typeMap[opts.format] || 'image/jpeg';
  const quality = opts.quality;

  const blob = await new Promise((res) => canvas.toBlob(b => res(b), mime, mime === 'image/png' ? undefined : quality / 100));
  if (!blob) {
    const dataUrl = canvas.toDataURL(mime, mime === 'image/png' ? undefined : quality / 100);
    const bstr = atob(dataUrl.split(',')[1]);
    const u8 = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i);
    return new Blob([u8], { type: mime });
  }
  return blob;
}

async function handleCompress() {
  if (state.files.length === 0) return alert('ابتدا چند تصویر انتخاب کنید.');
  zipBtn.disabled = true;
  const opts = { quality: Number(quality.value), maxDim: Number(maxDim.value), format: format.value };
  for (let i = 0; i < state.files.length; i++) {
    const f = state.files[i];
    const progressBar = document.getElementById(`progress-${i}`);
    try {
      progressBar.style.width = '20%';
      const blob = await compressImage(f, opts);
      progressBar.style.width = '100%';
      state.results.set(f.name, { blob });
    } catch (err) {
      console.error(err);
      progressBar.style.background = 'var(--danger)';
    }
  }
  updateSummary();
  zipBtn.disabled = state.results.size === 0;
}

async function handleZip() {
  if (state.results.size === 0) return;
  const zip = new JSZip();
  const ext = format.value === 'jpeg' ? 'jpg' : format.value;
  for (const f of state.files) {
    const res = state.results.get(f.name);
    if (!res) continue;
    const name = f.name.replace(/\.[^.]+$/, '') + `.${ext}`;
    zip.file(name, res.blob);
  }
  const content = await zip.generateAsync({ type: 'blob' });
  const filename = `compressed_${Date.now()}.zip`;
  if (window.saveAs) saveAs(content, filename);
  else {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  }
}

function handleReset() {
  fileInput.value = '';
  state.files = []; state.results.clear();
  preview.innerHTML = '';
  updateSummary();
}

function handleClear() {
  state.files = []; state.results.clear(); renderPreview(); updateSummary();
}

compressBtn.addEventListener('click', handleCompress);
zipBtn.addEventListener('click', handleZip);
resetBtn.addEventListener('click', handleReset);
clearBtn.addEventListener('click', handleClear);

updateSummary();
