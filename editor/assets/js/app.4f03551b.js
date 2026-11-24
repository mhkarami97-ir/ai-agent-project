(function () {
'use strict';

/* @logic-start */
/* ---------- رندر مارک‌داون امن: متن ← AST ← DOM/HTML (HTML خام هرگز اجرا نمی‌شود) ---------- */
function T(v) { return { t: '#', v: v }; }
function N(t, c, a) { return { t: t, c: c || [], a: a || {} }; }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function safeUrl(u, isImg) {
  var s = String(u).trim(), probe = s.replace(/[\u0000-\u001f\u007f\s]+/g, '');
  var m = /^([a-z][a-z0-9+.-]*):/i.exec(probe);
  if (!m) return probe.indexOf('\\') >= 0 ? null : s;
  var sch = m[1].toLowerCase();
  if (sch === 'http' || sch === 'https') return s;
  if (!isImg && (sch === 'mailto' || sch === 'tel')) return s;
  if (isImg && /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+\/=]+$/i.test(probe)) return probe;
  return null;
}
var PUNCT = /[!-\/:-@\[-`{-~]/;
var WORDCH = /[\p{L}\p{N}]/u;
function isSpace(c) { return c === undefined || /\s/.test(c); }

function parseLinkAt(s, p) {
  var depth = 0, j = p, n = s.length;
  for (; j < n; j++) {
    var c = s[j];
    if (c === '\\') { j++; continue; }
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) break; }
  }
  if (j >= n || s[j + 1] !== '(') return null;
  var label = s.slice(p + 1, j), k = j + 2;
  while (k < n && /[ \t\n]/.test(s[k])) k++;
  var url = '';
  if (s[k] === '<') { var e = s.indexOf('>', k); if (e < 0) return null; url = s.slice(k + 1, e); k = e + 1; }
  else {
    var par = 0, st = k;
    for (; k < n; k++) {
      var d = s[k];
      if (d === '\\') { k++; continue; }
      if (/\s/.test(d)) break;
      if (d === '(') par++;
      else if (d === ')') { if (par === 0) break; par--; }
    }
    url = s.slice(st, k);
  }
  while (k < n && /[ \t\n]/.test(s[k])) k++;
  var title = '';
  if (s[k] === '"' || s[k] === "'") {
    var q = s[k], e2 = s.indexOf(q, k + 1);
    if (e2 < 0) return null;
    title = s.slice(k + 1, e2); k = e2 + 1;
    while (k < n && /[ \t\n]/.test(s[k])) k++;
  }
  if (s[k] !== ')') return null;
  return { label: label, url: url.replace(/\\([!-\/:-@\[-`{-~])/g, '$1'), title: title, end: k + 1 };
}
function findClose(s, from, ch, len, underscore) {
  var i = from, n = s.length;
  while (i < n) {
    if (s[i] === '\\') { i += 2; continue; }
    if (s[i] === '`') {
      var r0 = i; while (s[i] === '`') i++;
      var idx = s.indexOf(s.slice(r0, i), i);
      if (idx >= 0) i = idx + (i - r0);
      continue;
    }
    if (s[i] === ch) {
      var r = i; while (s[i] === ch) i++;
      if (i - r === len && !isSpace(s[r - 1]) && !(underscore && WORDCH.test(s[i] || ''))) return r;
      continue;
    }
    i++;
  }
  return -1;
}
function parseInline(s) {
  var out = [], buf = '', i = 0, n = s.length;
  function flush() { if (buf) { out.push(T(buf)); buf = ''; } }
  while (i < n) {
    var c = s[i];
    if (c === '\\' && i + 1 < n && PUNCT.test(s[i + 1])) { buf += s[i + 1]; i += 2; continue; }
    if (c === '\n') { flush(); out.push(N('br')); i++; continue; }
    if (c === '`') {
      var k = 0; while (s[i + k] === '`') k++;
      var j = i + k, found = -1;
      while (j < n) { var x = s.indexOf('`', j); if (x < 0) break; var m = 0; while (s[x + m] === '`') m++; if (m === k) { found = x; break; } j = x + m; }
      if (found >= 0) {
        var code = s.slice(i + k, found).replace(/\n/g, ' ');
        if (code.length > 2 && code[0] === ' ' && code[code.length - 1] === ' ' && code.trim()) code = code.slice(1, -1);
        flush(); out.push(N('code', [T(code)])); i = found + k; continue;
      }
      buf += '`'.repeat(k); i += k; continue;
    }
    if (c === '!' && s[i + 1] === '[') {
      var im = parseLinkAt(s, i + 1);
      if (im) {
        var src = safeUrl(im.url, true);
        flush();
        if (src) { var ia = { src: src, alt: im.label.replace(/[*_`~\[\]\\]/g, '') }; if (im.title) ia.title = im.title; out.push(N('img', [], ia)); }
        else out.push(T(im.label));
        i = im.end; continue;
      }
    }
    if (c === '[') {
      var lk = parseLinkAt(s, i);
      if (lk) {
        var href = safeUrl(lk.url, false);
        flush();
        var kids = parseInline(lk.label);
        if (href) { var la = { href: href }; if (lk.title) la.title = lk.title; out.push(N('a', kids, la)); } else kids.forEach(function (z) { out.push(z); });
        i = lk.end; continue;
      }
    }
    if (c === '<') {
      var am = /^<((?:https?:\/\/|mailto:)[^\s<>]+)>/i.exec(s.slice(i));
      if (am) { flush(); out.push(N('a', [T(am[1])], { href: am[1] })); i += am[0].length; continue; }
    }
    if (c === '*' || c === '_' || c === '~') {
      var run = 0; while (s[i + run] === c) run++;
      var len = c === '~' ? (run === 2 ? 2 : 0) : Math.min(run, 3);
      var next = s[i + run];
      var ok = len > 0 && !isSpace(next) && !(c === '_' && WORDCH.test(s[i - 1] || ''));
      if (ok) {
        var close = findClose(s, i + len, c, len, c === '_');
        if (close > i + len) {
          var inner = parseInline(s.slice(i + len, close));
          flush();
          if (c === '~') out.push(N('del', inner));
          else if (len === 1) out.push(N('em', inner));
          else if (len === 2) out.push(N('strong', inner));
          else out.push(N('strong', [N('em', inner)]));
          i = close + len; continue;
        }
      }
      buf += s.slice(i, i + run); i += run; continue;
    }
    buf += c; i++;
  }
  flush();
  return out;
}

var RE_FENCE = /^( {0,3})(`{3,}|~{3,})(.*)$/;
var RE_HEAD = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?[ \t]*$/;
var RE_HR = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
var RE_QUOTE = /^ {0,3}>/;
var RE_LIST = /^( {0,3})([-*+]|\d{1,9}[.)])(?:[ \t]+(.*)|$)/;
var RE_DELIM = /^[ \t]*\|?[ \t]*:?-+:?[ \t]*(?:\|[ \t]*:?-+:?[ \t]*)*\|?[ \t]*$/;
function isBlank(l) { return /^\s*$/.test(l); }
function indentOf(l) { var m = /^[ \t]*/.exec(l)[0]; return m.replace(/\t/g, '    ').length; }
function stripIndent(l, n) {
  var cols = 0, i = 0;
  while (i < l.length && cols < n && (l[i] === ' ' || l[i] === '\t')) { cols += l[i] === '\t' ? 4 : 1; i++; }
  return l.slice(i);
}
function splitRow(l) {
  var s = l.trim(); if (s[0] === '|') s = s.slice(1);
  if (s.length && s[s.length - 1] === '|' && s[s.length - 2] !== '\\') s = s.slice(0, -1);
  var cells = [], cur = '';
  for (var i = 0; i < s.length; i++) {
    if (s[i] === '\\' && s[i + 1] === '|') { cur += '|'; i++; }
    else if (s[i] === '|') { cells.push(cur.trim()); cur = ''; }
    else cur += s[i];
  }
  cells.push(cur.trim());
  return cells;
}
function listMarker(l) {
  var m = RE_LIST.exec(l); if (!m || RE_HR.test(l)) return null;
  var marker = m[2], ordered = /\d/.test(marker);
  var after = l.slice(m[1].length + marker.length), sp = /^[ \t]*/.exec(after)[0].length;
  return { indent: m[1].length, marker: marker, ordered: ordered, delim: ordered ? marker.slice(-1) : marker, num: ordered ? parseInt(marker, 10) : 0, rest: m[3] || '', spaces: sp };
}
function startsBlock(l) {
  if (RE_FENCE.test(l) || RE_HEAD.test(l) || RE_HR.test(l) || RE_QUOTE.test(l)) return true;
  var lm = listMarker(l);
  return !!(lm && lm.rest.trim() && (!lm.ordered || lm.num === 1));
}
function dirAttr() { return { dir: 'auto' }; }

function parseList(lines, start) {
  var first = listMarker(lines[start]), items = [], i = start, n = lines.length;
  while (i < n) {
    var mk = listMarker(lines[i]);
    if (!mk || mk.ordered !== first.ordered || mk.delim !== first.delim) break;
    var contentIndent = mk.indent + mk.marker.length + (mk.rest.trim() ? Math.min(Math.max(mk.spaces, 1), 4) : 1);
    var itemLines = [mk.rest], j = i + 1;
    while (j < n) {
      var l = lines[j];
      if (isBlank(l)) {
        var k = j + 1; while (k < n && isBlank(lines[k])) k++;
        if (k < n && indentOf(lines[k]) >= contentIndent) { itemLines.push(''); j++; continue; }
        break;
      }
      if (indentOf(l) >= contentIndent) { itemLines.push(stripIndent(l, contentIndent)); j++; continue; }
      var prev = itemLines[itemLines.length - 1];
      if (prev !== '' && !listMarker(l) && !startsBlock(l)) { itemLines.push(l.trim()); j++; continue; }
      break;
    }
    var blocks = parseBlocks(itemLines), task = null;
    if (blocks.length && blocks[0].t === 'p' && blocks[0].c.length && blocks[0].c[0].t === '#') {
      var tm = /^\[([ xX])\][ \t]+/.exec(blocks[0].c[0].v);
      if (tm) { task = tm[1] !== ' '; blocks[0].c[0] = T(blocks[0].c[0].v.slice(tm[0].length)); }
    }
    var kids = [];
    if (task !== null) kids.push(N('input', [], { type: 'checkbox', disabled: '', checked: task ? '' : null }));
    blocks.forEach(function (b, bi) { if (bi === 0 && b.t === 'p') b.c.forEach(function (z) { kids.push(z); }); else kids.push(b); });
    items.push(N('li', kids, Object.assign(dirAttr(), task !== null ? { class: 'task' } : {})));
    i = j;
    var q = i; while (q < n && isBlank(lines[q])) q++;
    var nm = q < n ? listMarker(lines[q]) : null;
    if (nm && nm.ordered === first.ordered && nm.delim === first.delim && nm.indent <= 3) i = q; else break;
  }
  var attrs = {};
  if (first.ordered && first.num !== 1) attrs.start = String(first.num);
  return { node: N(first.ordered ? 'ol' : 'ul', items, attrs), next: i };
}
function parseBlocks(lines) {
  var out = [], i = 0, n = lines.length, m;
  while (i < n) {
    var line = lines[i];
    if (isBlank(line)) { i++; continue; }
    if ((m = RE_FENCE.exec(line)) && !(m[2][0] === '`' && m[3].indexOf('`') >= 0)) {
      var ind = m[1].length, ch = m[2][0], flen = m[2].length, body = [], j = i + 1, closeRe = new RegExp('^ {0,3}\\' + ch + '{' + flen + ',}[ \\t]*$');
      while (j < n && !closeRe.test(lines[j])) { body.push(stripIndent(lines[j], ind)); j++; }
      var lang = m[3].trim().split(/\s+/)[0].replace(/[^\w+#.-]/g, '');
      out.push(N('pre', [N('code', [T(body.join('\n'))], lang ? { class: 'language-' + lang } : {})], { dir: 'ltr' }));
      i = j + 1; continue;
    }
    if ((m = RE_HEAD.exec(line))) {
      var lv = m[1].length, tx = (m[2] || '').replace(/(^|[ \t]+)#+[ \t]*$/, '');
      out.push(N('h' + lv, parseInline(tx.trim()), dirAttr())); i++; continue;
    }
    if (RE_HR.test(line)) { out.push(N('hr')); i++; continue; }
    if (RE_QUOTE.test(line)) {
      var ql = [], j2 = i;
      while (j2 < n && (RE_QUOTE.test(lines[j2]) || (!isBlank(lines[j2]) && ql.length && !startsBlock(lines[j2])))) { ql.push(lines[j2].replace(/^ {0,3}> ?/, '')); j2++; }
      out.push(N('blockquote', parseBlocks(ql), dirAttr())); i = j2; continue;
    }
    if (line.indexOf('|') >= 0 && i + 1 < n && RE_DELIM.test(lines[i + 1]) && lines[i + 1].indexOf('-') >= 0) {
      var head = splitRow(line), dl = splitRow(lines[i + 1]);
      if (head.length === dl.length) {
        var aligns = dl.map(function (d) { var l = d[0] === ':', r = d[d.length - 1] === ':'; return l && r ? 'center' : r ? 'right' : l ? 'left' : ''; });
        var cell = function (tag, txt, k) { var a = dirAttr(); if (aligns[k]) a.align = aligns[k]; return N(tag, parseInline(txt), a); };
        var thead = N('thead', [N('tr', head.map(function (h, k) { return cell('th', h, k); }))]);
        var rows = [], j3 = i + 2;
        while (j3 < n && !isBlank(lines[j3]) && lines[j3].indexOf('|') >= 0 && !startsBlock(lines[j3])) {
          var cells = splitRow(lines[j3]);
          rows.push(N('tr', head.map(function (_, k) { return cell('td', cells[k] || '', k); }))); j3++;
        }
        out.push(N('table', rows.length ? [thead, N('tbody', rows)] : [thead])); i = j3; continue;
      }
    }
    if (listMarker(line)) { var r = parseList(lines, i); out.push(r.node); i = r.next; continue; }
    var para = [line.replace(/^[ \t]+/, '')], j4 = i + 1, setext = 0;
    while (j4 < n) {
      var l2 = lines[j4];
      if (isBlank(l2)) break;
      var sm = /^ {0,3}(=+|-+)[ \t]*$/.exec(l2);
      if (sm) { setext = sm[1][0] === '=' ? 1 : 2; j4++; break; }
      if (startsBlock(l2)) break;
      para.push(l2.replace(/^[ \t]+/, '')); j4++;
    }
    var text = para.join('\n').replace(/[ \t]+$/gm, '');
    out.push(N(setext ? 'h' + setext : 'p', parseInline(text), dirAttr())); i = j4;
  }
  return out;
}
function parseMarkdown(src) { return parseBlocks(String(src == null ? '' : src).replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n')); }

var VOID = { br: 1, hr: 1, img: 1, input: 1 };
function attrStr(a) {
  var s = '';
  Object.keys(a || {}).forEach(function (k) {
    var v = a[k]; if (v === null || v === undefined) return;
    s += v === '' ? ' ' + k : ' ' + k + '="' + esc(v) + '"';
  });
  return s;
}
function toHTML(node) {
  if (Array.isArray(node)) return node.map(toHTML).join('');
  if (node.t === '#') return esc(node.v);
  var a = Object.assign({}, node.a);
  if (node.t === 'a') { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  if ((node.t === 'th' || node.t === 'td') && a.align) { a.style = 'text-align:' + a.align; delete a.align; }
  if (VOID[node.t]) return '<' + node.t + attrStr(a) + '>';
  return '<' + node.t + attrStr(a) + '>' + node.c.map(toHTML).join('') + '</' + node.t + '>';
}
var ALLOWED_ATTR = { href: 1, title: 1, src: 1, alt: 1, class: 1, start: 1, dir: 1, type: 1, disabled: 1, checked: 1, align: 1 };
function toDOM(node, doc) {
  if (node.t === '#') return doc.createTextNode(node.v);
  var el = doc.createElement(node.t);
  Object.keys(node.a || {}).forEach(function (k) {
    var v = node.a[k]; if (v === null || v === undefined || !ALLOWED_ATTR[k]) return;
    if (k === 'align') el.style.textAlign = v; else el.setAttribute(k, v);
  });
  if (node.t === 'a') { el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer'); }
  node.c.forEach(function (ch) { el.appendChild(toDOM(ch, doc)); });
  return el;
}
function renderHTML(src) { return toHTML(parseMarkdown(src)); }

/* ---------- قالب‌بندی متن در textarea (خالص، قابل‌تست) ---------- */
function wrapSelection(v, s, e, pre, suf, ph) {
  var sel = v.slice(s, e), body = sel || ph;
  if (sel && v.slice(s - pre.length, s) === pre && v.slice(e, e + suf.length) === suf) {
    return { from: s - pre.length, to: e + suf.length, text: sel, selStart: s - pre.length, selEnd: s - pre.length + sel.length };
  }
  return { from: s, to: e, text: pre + body + suf, selStart: s + pre.length, selEnd: s + pre.length + body.length };
}
function prefixLines(v, s, e, prefixFn) {
  var ls = v.lastIndexOf('\n', s - 1) + 1, le = v.indexOf('\n', e); if (le < 0) le = v.length;
  if (e > s && v[e - 1] === '\n') le = e - 1;
  var lines = v.slice(ls, le).split('\n');
  var allHave = lines.every(function (l, i) { var p = prefixFn(i); return l.indexOf(p) === 0; });
  var out = lines.map(function (l, i) { var p = prefixFn(i); return allHave ? l.slice(p.length) : p + l; }).join('\n');
  return { from: ls, to: le, text: out, selStart: ls, selEnd: ls + out.length };
}
function headingToggle(v, s, e) {
  var ls = v.lastIndexOf('\n', s - 1) + 1, le = v.indexOf('\n', s); if (le < 0) le = v.length;
  var line = v.slice(ls, le), m = /^(#{1,6}) /.exec(line);
  var out = !m ? '# ' + line : m[1].length >= 3 ? line.slice(m[0].length) : '#' + m[1] + ' ' + line.slice(m[0].length);
  return { from: ls, to: le, text: out, selStart: ls + out.length, selEnd: ls + out.length };
}
function wordStats(text) {
  var words = (String(text).match(/[\p{L}\p{N}][\p{L}\p{N}'’_-]*/gu) || []).length;
  return { words: words, chars: Array.from(String(text)).length };
}
function docHtml(title, bodyHtml, forWord) {
  var ns = forWord ? ' xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"' : '';
  var css = 'body{font-family:Vazirmatn,Tahoma,"Segoe UI",sans-serif;line-height:1.9;direction:rtl;text-align:right}pre,code{direction:ltr;font-family:Consolas,monospace}pre{background:#f1f5f9;padding:10px;white-space:pre-wrap}blockquote{border-right:4px solid #0d9488;margin:0 0 1em;padding:0 1em;color:#555}table{border-collapse:collapse}th,td{border:1px solid #999;padding:4px 8px}img{max-width:100%}';
  return '<!DOCTYPE html><html lang="fa" dir="rtl"' + ns + '><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>' + css + '</style></head><body dir="rtl">' + bodyHtml + '</body></html>';
}
/* @logic-end */

var KEY = 'rtl-md-editor-content';
var lang = 'fa', dict = {};
try { lang = String(localStorage.getItem('lang') || '').replace(/"/g, '') === 'en' ? 'en' : 'fa'; } catch (e) {}
function t(key, vars) {
  var s = (dict[lang] && dict[lang][key]) || (dict.fa && dict.fa[key]) || key;
  if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
  return s;
}
function nf(n) { return new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US').format(n); }
function $(id) { return document.getElementById(id); }

var renderTimer, saveTimer, statusTimer;
function applyI18n() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(function (e) { e.textContent = t(e.getAttribute('data-i18n')); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (e) { e.placeholder = t(e.getAttribute('data-i18n-placeholder')); });
  document.querySelectorAll('[data-i18n-aria]').forEach(function (e) { e.setAttribute('aria-label', t(e.getAttribute('data-i18n-aria'))); });
  document.title = t('title');
  updateCounts();
}
function setStatus(msg, hold) {
  $('statusMsg').textContent = msg; clearTimeout(statusTimer);
  if (!hold) statusTimer = setTimeout(function () { $('statusMsg').textContent = t('saved_all'); }, 2000);
}
var toastTimer;
function toast(msg, isError) {
  var n = $('toast'); n.textContent = msg; n.className = 'pm-toast' + (isError ? ' is-error' : ''); n.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { n.hidden = true; }, 2800);
}
function confirmDialog(message) {
  return new Promise(function (resolve) {
    var d = $('confirmDialog'); $('confirmText').textContent = message;
    var done = function () { d.removeEventListener('close', done); resolve(d.returnValue === 'ok'); };
    d.returnValue = ''; d.addEventListener('close', done); d.showModal();
  });
}
function updateCounts() { var s = wordStats($('editor').value); $('counts').textContent = t('counts', { w: nf(s.words), c: nf(s.chars) }); }
function renderPreview() {
  var box = $('preview'); box.textContent = '';
  var nodes = parseMarkdown($('editor').value);
  var frag = document.createDocumentFragment();
  nodes.forEach(function (nd) { frag.appendChild(toDOM(nd, document)); });
  box.appendChild(frag);
  updateCounts();
}
function save(label) {
  try { var v = $('editor').value; if (v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY); setStatus(label || t('saved')); }
  catch (e) { setStatus(t('save_failed'), true); toast(t('save_failed'), true); }
}
function onEdit() {
  clearTimeout(renderTimer); renderTimer = setTimeout(renderPreview, 120);
  setStatus(t('saving'), true); clearTimeout(saveTimer); saveTimer = setTimeout(function () { save(); }, 750);
  updateCounts();
}
function setText(v) { $('editor').value = v; renderPreview(); save(); }

/* قالب‌بندی با حفظ undo مرورگر */
function applyEdit(r) {
  var ta = $('editor'); ta.focus(); ta.setSelectionRange(r.from, r.to);
  var done = false; try { done = document.execCommand('insertText', false, r.text); } catch (e) {}
  if (!done) { ta.setRangeText(r.text, r.from, r.to, 'end'); ta.dispatchEvent(new Event('input', { bubbles: true })); }
  ta.setSelectionRange(r.selStart, r.selEnd);
}
function format(act) {
  var ta = $('editor'), v = ta.value, s = ta.selectionStart, e = ta.selectionEnd, r;
  if (act === 'bold') r = wrapSelection(v, s, e, '**', '**', t('ph_bold'));
  else if (act === 'italic') r = wrapSelection(v, s, e, '*', '*', t('ph_italic'));
  else if (act === 'strike') r = wrapSelection(v, s, e, '~~', '~~', t('ph_strike'));
  else if (act === 'code') {
    var multi = v.slice(s, e).indexOf('\n') >= 0;
    r = multi ? wrapSelection(v, s, e, '```\n', '\n```', '') : wrapSelection(v, s, e, '`', '`', t('ph_code'));
  }
  else if (act === 'link') {
    var label = v.slice(s, e) || t('ph_link'), txt = '[' + label + '](https://)';
    r = { from: s, to: e, text: txt, selStart: s + label.length + 3, selEnd: s + label.length + 11 };
  }
  else if (act === 'ul') r = prefixLines(v, s, e, function () { return '- '; });
  else if (act === 'ol') r = prefixLines(v, s, e, function (i) { return (i + 1) + '. '; });
  else if (act === 'quote') r = prefixLines(v, s, e, function () { return '> '; });
  else if (act === 'h') r = headingToggle(v, s, e);
  if (r) applyEdit(r);
}

function download(blob, name) {
  var url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
}
function docTitle() {
  var m = /^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/m.exec($('editor').value);
  return (m ? m[1].replace(/[*_`~\[\]()]/g, '') : t('doc_untitled')).slice(0, 80);
}
function safeName() { return docTitle().replace(/[\\/:*?"<>|\s]+/g, '-').replace(/^-+|-+$/g, '') || 'document'; }
function pane(name) {
  document.querySelectorAll('.pm-tab').forEach(function (b) { var on = b.dataset.pane === name; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
  $('editPane').hidden = name !== 'edit'; $('previewPane').hidden = name !== 'preview';
  if (name === 'preview') renderPreview();
}
function exportPdf() {
  renderPreview();
  var prev = document.title; document.title = safeName();
  var back = function () { document.title = prev; window.removeEventListener('afterprint', back); };
  window.addEventListener('afterprint', back);
  window.print();
}
async function newDoc() {
  if ($('editor').value.trim() && !(await confirmDialog(t('confirm_new')))) return;
  setText(''); setStatus(t('new_ready'));
}
async function loadSample() {
  if ($('editor').value.trim() && !(await confirmDialog(t('confirm_sample')))) return;
  setText(t('sample')); setStatus(t('sample_loaded'));
}
function openFile(e) {
  var f = e.target.files[0]; e.target.value = ''; if (!f) return;
  if (f.size > 2 * 1024 * 1024) { toast(t('err_big'), true); return; }
  var r = new FileReader();
  r.onload = async function () {
    if ($('editor').value.trim() && !(await confirmDialog(t('confirm_open')))) return;
    setText(String(r.result)); setStatus(t('file_loaded'));
  };
  r.onerror = function () { toast(t('err_read'), true); };
  r.readAsText(f);
}

function bind() {
  $('editor').addEventListener('input', onEdit);
  document.addEventListener('keydown', function (e) {
    var mod = e.metaKey || e.ctrlKey, k = e.key.toLowerCase();
    if (mod && k === 's') { e.preventDefault(); save(t('saved_shortcut')); }
    else if (mod && document.activeElement === $('editor') && (k === 'b' || k === 'i' || k === 'k')) { e.preventDefault(); format(k === 'b' ? 'bold' : k === 'i' ? 'italic' : 'link'); }
  });
  document.querySelector('.pm-fmt').addEventListener('click', function (e) { var b = e.target.closest('[data-act]'); if (b) format(b.dataset.act); });
  document.querySelectorAll('.pm-tab').forEach(function (b) { b.addEventListener('click', function () { pane(b.dataset.pane); }); });
  $('newBtn').addEventListener('click', newDoc);
  $('sampleBtn').addEventListener('click', loadSample);
  $('openBtn').addEventListener('click', function () { $('fileInput').click(); });
  $('fileInput').addEventListener('change', openFile);
  $('saveBtn').addEventListener('click', function () { save(t('saved_manual')); });
  $('pdfBtn').addEventListener('click', exportPdf);
  $('docBtn').addEventListener('click', function () { download(new Blob(['\ufeff' + docHtml(docTitle(), renderHTML($('editor').value), true)], { type: 'application/msword' }), safeName() + '.doc'); toast(t('ok_export')); });
  $('htmlBtn').addEventListener('click', function () { download(new Blob([docHtml(docTitle(), renderHTML($('editor').value), false)], { type: 'text/html;charset=utf-8' }), safeName() + '.html'); toast(t('ok_export')); });
  $('mdBtn').addEventListener('click', function () { download(new Blob([$('editor').value], { type: 'text/markdown;charset=utf-8' }), safeName() + '.md'); toast(t('ok_export')); });
  $('confirmDialog').addEventListener('click', function (e) { if (e.target === e.currentTarget) e.currentTarget.close(); });
  window.addEventListener('beforeunload', function () { if (saveTimer) { clearTimeout(saveTimer); try { var v = $('editor').value; if (v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY); } catch (e) {} } });
  window.addEventListener('languageChanged', function (e) { lang = e.detail === 'en' ? 'en' : 'fa'; applyI18n(); setStatus(t('saved_all'), true); });
}

async function boot() {
  try { dict = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  try { var c = localStorage.getItem(KEY); if (c) $('editor').value = c; } catch (e) {}
  applyI18n(); bind(); renderPreview(); setStatus(t('saved_all'), true);
  pane('edit');
}
document.addEventListener('DOMContentLoaded', boot);
})();
