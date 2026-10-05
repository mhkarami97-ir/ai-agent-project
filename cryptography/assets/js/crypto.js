(() => {
'use strict';
const MAGIC = [0xC7, 0x01];
const ITER = 250000, LEGACY_ITER = 100000;
const SALT_LEN = 16, IV_LEN = 12, TAG_LEN = 16;
const MIN_PW = 8, MAX_CHARS = 5000;
const MIN_PAYLOAD = MAGIC.length + SALT_LEN + IV_LEN + TAG_LEN + 1;
const ORDER = ['persian', 'english', 'numbers', 'symbols'];
const ALPHABETS = {
  persian: Array.from('آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهیئءأإؤ'),
  english: Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'),
  numbers: Array.from('0123456789'),
  symbols: Array.from('!@#$%^&*()_+-=[]{}|;:,.<>?/~')
};
const enc = new TextEncoder(), dec = new TextDecoder('utf-8', { fatal: true });
const err = code => new Error(code);

const concat = (...a) => { const o = new Uint8Array(a.reduce((s, x) => s + x.length, 0)); let p = 0; for (const x of a) { o.set(x, p); p += x.length; } return o; };
const normalize = s => s.replace(/[\s\u200b-\u200f\u2060\ufeff]/g, '').replace(/\u064a/g, '\u06cc').replace(/\u0643/g, '\u06a9');

function alphabetFor(sets) {
  const chosen = ORDER.filter(k => sets.includes(k));
  return chosen.flatMap(k => ALPHABETS[k]);
}
function bytesToText(bytes, alphabet) {
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  let v = BigInt('0x' + hex);
  const n = BigInt(alphabet.length), out = [];
  while (v > 0n) { out.push(alphabet[Number(v % n)]); v /= n; }
  return out.reverse().join('');
}
function textToBytes(chars, alphabet) {
  const map = new Map(alphabet.map((c, i) => [c, i]));
  const n = BigInt(alphabet.length);
  let v = 0n;
  for (const c of chars) {
    const i = map.get(c);
    if (i === undefined) return null;
    v = v * n + BigInt(i);
  }
  let hex = v.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

async function deriveKey(pw, salt, iter) {
  const base = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

function validatePassword(pw) { if (typeof pw !== 'string' || pw.length < MIN_PW) throw err('SHORT_KEY'); }

async function encrypt(plain, password, sets) {
  if (typeof plain !== 'string' || plain.trim() === '') throw err('EMPTY_TEXT');
  if (plain.length > MAX_CHARS) throw err('TOO_LONG');
  validatePassword(password);
  const alphabet = alphabetFor(sets || []);
  if (!alphabet.length) throw err('NO_CHARSET');
  const header = Uint8Array.from(MAGIC);
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const key = await deriveKey(password.normalize('NFKC'), salt, ITER);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: header }, key, enc.encode(plain)));
  return bytesToText(concat(header, salt, iv, ct), alphabet);
}

async function openPayload(bytes, password) {
  const salt = bytes.slice(2, 2 + SALT_LEN), iv = bytes.slice(2 + SALT_LEN, 2 + SALT_LEN + IV_LEN), ct = bytes.slice(2 + SALT_LEN + IV_LEN);
  const key = await deriveKey(password.normalize('NFKC'), salt, ITER);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: Uint8Array.from(MAGIC) }, key, ct);
  return dec.decode(pt);
}
async function openLegacy(b64, password) {
  const bin = atob(b64), bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  if (bytes.length < SALT_LEN + IV_LEN + TAG_LEN) throw err('DECRYPT_FAILED');
  const key = await deriveKey(password, bytes.slice(0, SALT_LEN), LEGACY_ITER);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(SALT_LEN, SALT_LEN + IV_LEN) }, key, bytes.slice(SALT_LEN + IV_LEN));
  return dec.decode(pt);
}

async function decrypt(text, password) {
  if (typeof text !== 'string' || text.trim() === '') throw err('EMPTY_TEXT');
  validatePassword(password);
  const clean = normalize(text), chars = Array.from(clean);
  const candidates = [];
  for (let mask = 1; mask < 16; mask++) {
    const sets = ORDER.filter((_, i) => mask & (1 << i));
    const alphabet = alphabetFor(sets);
    const set = new Set(alphabet);
    if (!chars.every(c => set.has(c))) continue;
    const bytes = textToBytes(chars, alphabet);
    if (bytes && bytes.length >= MIN_PAYLOAD && bytes[0] === MAGIC[0] && bytes[1] === MAGIC[1]) candidates.push(bytes);
  }
  for (const bytes of candidates) {
    try { return await openPayload(bytes, password); } catch (e) { /* try next */ }
  }
  const tail = clean.includes('|') ? clean.slice(clean.lastIndexOf('|') + 1) : clean;
  if (/^[A-Za-z0-9+/]{40,}={0,2}$/.test(tail)) {
    try { return await openLegacy(tail, password); } catch (e) { /* fall through */ }
  }
  throw err('DECRYPT_FAILED');
}

window.cryptoManager = { encrypt, decrypt, ALPHABETS, ORDER, MAX_CHARS, MIN_PW, _normalize: normalize };
})();
