(() => {
'use strict';
const $ = id => document.getElementById(id);
const CS_KEY = { persian: 'csPersian', english: 'csEnglish', numbers: 'csNumbers', symbols: 'csSymbols' };
const ERR = { EMPTY_TEXT: 'errEmptyText', SHORT_KEY: 'errShortKey', TOO_LONG: 'errTooLong', NO_CHARSET: 'errNoCharset', DECRYPT_FAILED: 'errDecrypt' };
let T = {}, lang = localStorage.getItem('lang') || 'fa', last = null, toastTimer = null, tab = 'encrypt';

const t = (k, v) => {
  let s = (T[lang] && T[lang][k]) ?? (T.fa && T.fa[k]) ?? k;
  if (v) for (const [a, b] of Object.entries(v)) s = s.replace('{' + a + '}', b);
  return s;
};
const locale = () => lang === 'fa' ? 'fa-IR' : 'en-US';

function applyTheme(th) {
  const v = th === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', v);
  document.body.setAttribute('data-theme', v);
}
function applyI18n() {
  const r = document.documentElement;
  r.lang = lang; r.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = t(e.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(e => { e.placeholder = t(e.dataset.i18nPh); });
  document.querySelectorAll('[data-i18n-aria]').forEach(e => { e.setAttribute('aria-label', t(e.dataset.i18nAria)); });
  document.title = t('title');
  loadHistory();
}

function toast(msg, type = 'success') {
  const el = $('toast');
  el.textContent = msg; el.className = 'toast show ' + type;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}
const errText = e => t(ERR[e && e.message] || 'errUnexpected');

async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast(t('copied')); }
  catch {
    const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.append(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch {}
    ta.remove(); toast(ok ? t('copied') : t('copyFail'), ok ? 'success' : 'error');
  }
}

function askConfirm(message) {
  return new Promise(res => {
    const d = $('confirm-dialog'); $('confirm-message').textContent = message;
    const done = v => { $('confirm-yes').onclick = $('confirm-no').onclick = null; d.onclose = null; if (d.open) d.close(); res(v); };
    $('confirm-yes').onclick = () => done(true); $('confirm-no').onclick = () => done(false); d.onclose = () => done(false);
    d.showModal();
  });
}

function switchTab(name) {
  tab = name;
  document.querySelectorAll('.tab-button').forEach(b => {
    const on = b.dataset.tab === name;
    b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
  });
  document.querySelectorAll('.tab-content').forEach(p => { p.hidden = p.id !== name + '-tab'; });
  if (name === 'history') loadHistory();
}

function busy(btnId, on) { $(btnId).disabled = on; }

async function onEncrypt(e) {
  e.preventDefault();
  const sets = [...document.querySelectorAll('input[name="charset"]:checked')].map(c => c.value);
  busy('encrypt-btn', true);
  try {
    const text = await cryptoManager.encrypt($('plain-text').value, $('encrypt-key').value, sets);
    $('encrypted-text').textContent = text; $('encrypt-result').hidden = false;
    last = { displayText: text, charsets: sets };
    toast(t('encryptedOk'));
  } catch (err) { toast(errText(err), 'error'); }
  finally { busy('encrypt-btn', false); }
}
async function onDecrypt(e) {
  e.preventDefault();
  busy('decrypt-btn', true);
  try {
    const plain = await cryptoManager.decrypt($('cipher-text').value, $('decrypt-key').value);
    $('decrypted-text').textContent = plain; $('decrypt-result').hidden = false; $('decrypt-error').hidden = true;
    toast(t('decryptedOk'));
  } catch (err) {
    $('decrypt-result').hidden = true; $('decrypted-text').textContent = '';
    $('decrypt-error-text').textContent = errText(err); $('decrypt-error').hidden = false;
  } finally { busy('decrypt-btn', false); }
}
async function saveCurrent() {
  if (!last) return toast(t('noItem'), 'error');
  try { await storageManager.save(last); toast(t('saved')); loadHistory(); }
  catch { toast(t('errSave'), 'error'); }
}

async function loadHistory() {
  const list = $('history-list'); list.replaceChildren();
  let items = [];
  try { items = await storageManager.getAll(); } catch { const p = document.createElement('p'); p.className = 'empty-state'; p.textContent = t('historyLoadErr'); list.append(p); return; }
  if (!items.length) { const p = document.createElement('p'); p.className = 'empty-state'; p.textContent = t('historyEmpty'); list.append(p); return; }
  for (const it of items) {
    const card = document.createElement('div'); card.className = 'history-item';
    const head = document.createElement('div'); head.className = 'history-item-header';
    const d = document.createElement('span'); d.className = 'history-item-date';
    d.textContent = new Date(it.timestamp).toLocaleString(locale(), { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const cs = document.createElement('span'); cs.className = 'history-item-charset';
    cs.textContent = (it.charsets || []).map(k => CS_KEY[k] ? t(CS_KEY[k]) : k).join(' + ');
    head.append(d, cs);
    const p = document.createElement('p'); p.className = 'history-item-text'; p.dir = 'auto';
    p.textContent = it.displayText.length > 150 ? it.displayText.slice(0, 150) + '…' : it.displayText;
    const acts = document.createElement('div'); acts.className = 'history-item-actions';
    const mk = (cls, icon, key, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ' + cls; b.textContent = icon + ' ' + t(key); b.addEventListener('click', fn); return b; };
    acts.append(
      mk('btn-secondary', '🔓', 'useDecrypt', () => { $('cipher-text').value = it.displayText; switchTab('decrypt'); toast(t('usedInDecrypt')); }),
      mk('btn-secondary', '📋', 'copy', () => copy(it.displayText)),
      mk('btn-danger', '🗑️', 'delete', async () => {
        if (!await askConfirm(t('delItemMsg'))) return;
        try { await storageManager.remove(it.id); toast(t('deleted')); loadHistory(); } catch { toast(t('errSave'), 'error'); }
      }));
    card.append(head, p, acts); list.append(card);
  }
}
async function clearHistory() {
  if (!await askConfirm(t('clearMsg'))) return;
  try { await storageManager.clear(); toast(t('cleared')); loadHistory(); } catch { toast(t('errSave'), 'error'); }
}

function bind() {
  document.querySelectorAll('.tab-button').forEach(b => {
    b.addEventListener('click', () => switchTab(b.dataset.tab));
    b.addEventListener('keydown', e => {
      const tabs = [...document.querySelectorAll('.tab-button')], i = tabs.indexOf(b);
      const dir = e.key === 'ArrowRight' ? (document.dir === 'rtl' ? -1 : 1) : e.key === 'ArrowLeft' ? (document.dir === 'rtl' ? 1 : -1) : 0;
      if (!dir) return;
      e.preventDefault(); const n = tabs[(i + dir + tabs.length) % tabs.length]; n.focus(); switchTab(n.dataset.tab);
    });
  });
  $('encrypt-form').addEventListener('submit', onEncrypt);
  $('decrypt-form').addEventListener('submit', onDecrypt);
  document.querySelectorAll('.toggle-password').forEach(b => b.addEventListener('click', () => {
    const i = $(b.dataset.target), show = i.type === 'password';
    i.type = show ? 'text' : 'password'; b.textContent = show ? '🙈' : '👁️';
    b.setAttribute('aria-pressed', String(show)); b.setAttribute('aria-label', t(show ? 'hideKey' : 'showKey'));
  }));
  $('copy-encrypted').addEventListener('click', () => copy($('encrypted-text').textContent));
  $('copy-decrypted').addEventListener('click', () => copy($('decrypted-text').textContent));
  $('hide-decrypted').addEventListener('click', () => { $('decrypted-text').textContent = ''; $('decrypt-result').hidden = true; });
  $('save-encrypted').addEventListener('click', saveCurrent);
  $('clear-history').addEventListener('click', clearHistory);
  $('confirm-dialog').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
  window.addEventListener('themeChanged', e => applyTheme(e.detail));
  window.addEventListener('languageChanged', e => { lang = e.detail === 'en' ? 'en' : 'fa'; localStorage.setItem('lang', lang); applyI18n(); });
}

async function init() {
  applyTheme(localStorage.getItem('theme'));
  try { T = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  bind(); applyI18n(); switchTab('encrypt');
  if (!(window.crypto && crypto.subtle)) {
    ['encrypt-btn', 'decrypt-btn'].forEach(id => { $(id).disabled = true; });
    toast(t('errNoCrypto'), 'error');
  }
}
init();
})();
