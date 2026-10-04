(function () {
'use strict';

/* @logic-start */
/* ---------- ابزارهای باینری ---------- */
var CRC_TABLE = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8, from, to) { var c = 0xFFFFFFFF; for (var i = from; i < to; i++) c = CRC_TABLE[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function ascii(u8, from, to) { var s = ''; for (var i = from; i < to && i < u8.length; i++) s += String.fromCharCode(u8[i]); return s; }
function concat(parts) {
  var n = 0; parts.forEach(function (p) { n += p.length; });
  var out = new Uint8Array(n), o = 0; parts.forEach(function (p) { out.set(p, o); o += p.length; });
  return out;
}
function detectFormat(u8) {
  if (u8.length > 3 && u8[0] === 0xFF && u8[1] === 0xD8 && u8[2] === 0xFF) return 'jpeg';
  if (u8.length > 8 && u8[0] === 0x89 && ascii(u8, 1, 4) === 'PNG' && u8[4] === 0x0D && u8[5] === 0x0A && u8[6] === 0x1A && u8[7] === 0x0A) return 'png';
  if (u8.length > 12 && ascii(u8, 0, 4) === 'RIFF' && ascii(u8, 8, 12) === 'WEBP') return 'webp';
  return null;
}
/* TIFF حداقلی فقط با برچسب Orientation (بدون هیچ داده‌ٔ دیگر) */
function minimalTiff(orientation) {
  return Uint8Array.from([0x4D, 0x4D, 0x00, 0x2A, 0, 0, 0, 8, 0, 1, 0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, orientation & 255, 0, 0, 0, 0, 0, 0]);
}

/* ---------- خواندن TIFF/EXIF با کنترل مرزها ---------- */
var TAGS = {
  ifd0: { 0x010E: 'ImageDescription', 0x010F: 'Make', 0x0110: 'Model', 0x0112: 'Orientation', 0x011A: 'XResolution', 0x011B: 'YResolution', 0x0128: 'ResolutionUnit', 0x0131: 'Software', 0x0132: 'DateTime', 0x013B: 'Artist', 0x013C: 'HostComputer', 0x8298: 'Copyright', 0x0100: 'ImageWidth', 0x0101: 'ImageLength' },
  exif: { 0x829A: 'ExposureTime', 0x829D: 'FNumber', 0x8822: 'ExposureProgram', 0x8827: 'ISO', 0x9000: 'ExifVersion', 0x9003: 'DateTimeOriginal', 0x9004: 'DateTimeDigitized', 0x9204: 'ExposureBias', 0x9207: 'MeteringMode', 0x9209: 'Flash', 0x920A: 'FocalLength', 0x927C: 'MakerNote', 0x9286: 'UserComment', 0xA002: 'PixelXDimension', 0xA003: 'PixelYDimension', 0xA405: 'FocalLengthIn35mm', 0xA420: 'ImageUniqueID', 0xA430: 'CameraOwnerName', 0xA431: 'BodySerialNumber', 0xA433: 'LensMake', 0xA434: 'LensModel', 0xA435: 'LensSerialNumber' },
  gps: { 0: 'GPSVersionID', 1: 'GPSLatitudeRef', 2: 'GPSLatitude', 3: 'GPSLongitudeRef', 4: 'GPSLongitude', 5: 'GPSAltitudeRef', 6: 'GPSAltitude', 7: 'GPSTimeStamp', 0x10: 'GPSImgDirection', 0x1B: 'GPSProcessingMethod', 0x1D: 'GPSDateStamp' }
};
var TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 };
function parseTiff(u8, base, len) {
  var out = { entries: [], thumbnail: false, ok: false };
  if (!(len >= 8) || base < 0 || base + len > u8.length) return out;
  var le = ascii(u8, base, base + 2) === 'II';
  if (!le && ascii(u8, base, base + 2) !== 'MM') return out;
  var dv = new DataView(u8.buffer, u8.byteOffset + base, len);
  if (dv.getUint16(2, le) !== 42) return out;
  out.ok = true;
  var visited = {};
  function value(type, count, entryOff) {
    var sz = TYPE_SIZE[type]; if (!sz || count < 1 || count > 100000) return undefined;
    var total = sz * count, off = total <= 4 ? entryOff + 8 : dv.getUint32(entryOff + 8, le);
    if (off < 0 || off + total > len) return undefined;
    if (type === 2) { var s = ''; for (var i = 0; i < Math.min(count, 512); i++) { var c = dv.getUint8(off + i); if (c === 0) break; s += String.fromCharCode(c); } return s.trim(); }
    if (type === 7) return { raw: total };
    var vals = [], lim = Math.min(count, 8);
    for (var j = 0; j < lim; j++) {
      var p = off + j * sz;
      if (type === 1 || type === 6) vals.push(type === 1 ? dv.getUint8(p) : dv.getInt8(p));
      else if (type === 3) vals.push(dv.getUint16(p, le)); else if (type === 8) vals.push(dv.getInt16(p, le));
      else if (type === 4) vals.push(dv.getUint32(p, le)); else if (type === 9) vals.push(dv.getInt32(p, le));
      else if (type === 5) { var d = dv.getUint32(p + 4, le); vals.push(d ? dv.getUint32(p, le) / d : 0); }
      else if (type === 10) { var d2 = dv.getInt32(p + 4, le); vals.push(d2 ? dv.getInt32(p, le) / d2 : 0); }
      else if (type === 11) vals.push(dv.getFloat32(p, le)); else if (type === 12) vals.push(dv.getFloat64(p, le));
    }
    return count === 1 ? vals[0] : vals;
  }
  function readIfd(off, kind, depth) {
    if (depth > 4 || off < 8 || off + 2 > len || visited[off]) return 0;
    visited[off] = 1;
    var n = dv.getUint16(off, le); if (n > 512 || off + 2 + n * 12 > len) n = Math.min(n, Math.floor((len - off - 2) / 12));
    for (var i = 0; i < n; i++) {
      var e = off + 2 + i * 12, tag = dv.getUint16(e, le), type = dv.getUint16(e + 2, le), count = dv.getUint32(e + 4, le);
      if (kind === 'ifd0' || kind === 'exif') {
        if (tag === 0x8769 && kind === 'ifd0') { readIfd(dv.getUint32(e + 8, le), 'exif', depth + 1); continue; }
        if (tag === 0x8825 && kind === 'ifd0') { readIfd(dv.getUint32(e + 8, le), 'gps', depth + 1); continue; }
      }
      if (kind === 'ifd1') { if (tag === 0x0201 || tag === 0x0202) out.thumbnail = true; continue; }
      var name = (TAGS[kind] || {})[tag], v = value(type, count, e);
      if (name !== undefined || v !== undefined) out.entries.push({ ifd: kind, tag: tag, name: name || null, value: v });
    }
    var nextPos = off + 2 + n * 12;
    return nextPos + 4 <= len ? dv.getUint32(nextPos, le) : 0;
  }
  var next = readIfd(dv.getUint32(4, le), 'ifd0', 0);
  if (next) { out.thumbnail = out.thumbnail || next > 0; readIfd(next, 'ifd1', 0); }
  return out;
}
function dms(v) { return Array.isArray(v) && v.length >= 3 ? v[0] + v[1] / 60 + v[2] / 3600 : null; }
function fmtRational(n) { return Math.round(n * 1000) / 1000; }
function exifToItems(t) {
  var items = [], by = {};
  t.entries.forEach(function (e) { if (e.name) by[e.ifd + ':' + e.name] = e.value; });
  var lat = dms(by['gps:GPSLatitude']), lon = dms(by['gps:GPSLongitude']);
  var hasGps = t.entries.some(function (e) { return e.ifd === 'gps'; });
  if (lat !== null && lon !== null) {
    if (by['gps:GPSLatitudeRef'] === 'S') lat = -lat; if (by['gps:GPSLongitudeRef'] === 'W') lon = -lon;
    items.push({ group: 'gps', key: 'GPSPosition', value: lat.toFixed(5) + ', ' + lon.toFixed(5), level: 'hi' });
  }
  if (typeof by['gps:GPSAltitude'] === 'number') items.push({ group: 'gps', key: 'GPSAltitude', value: fmtRational(by['gps:GPSAltitude']) + ' m', level: 'hi' });
  if (hasGps && lat === null) items.push({ group: 'gps', key: 'GPSPosition', value: '…', level: 'hi' });
  t.entries.forEach(function (e) {
    if (!e.name || e.ifd === 'gps') return;
    var v = e.value, key = e.name, group = 'other', level = 'low';
    if (v && typeof v === 'object' && !Array.isArray(v)) v = (key === 'MakerNote' || key === 'UserComment') ? v.raw + ' B' : null;
    if (v === null || v === undefined || v === '') return;
    if (Array.isArray(v)) v = v.map(fmtRational).join(', '); else if (typeof v === 'number') v = fmtRational(v);
    if (key === 'ExposureTime' && typeof e.value === 'number') v = e.value >= 1 ? String(e.value) : '1/' + Math.round(1 / e.value);
    if (key === 'FNumber') v = 'f/' + v;
    if (key === 'FocalLength') v += ' mm';
    if (/^(Make|Model|LensMake|LensModel)$/.test(key)) { group = 'device'; level = 'mid'; }
    else if (/Serial|CameraOwnerName|ImageUniqueID/.test(key)) { group = 'device'; level = 'hi'; }
    else if (/^DateTime/.test(key)) { group = 'time'; level = 'mid'; }
    else if (/^(Software|HostComputer|Copyright|ImageDescription)$/.test(key)) { group = 'owner'; level = 'mid'; }
    else if (key === 'Artist' || key === 'UserComment') { group = 'owner'; level = 'hi'; }
    else if (/^(ExposureTime|FNumber|ISO|ExposureBias|ExposureProgram|MeteringMode|Flash|FocalLength|FocalLengthIn35mm)$/.test(key)) group = 'shooting';
    else if (/^(Orientation|ImageWidth|ImageLength|PixelXDimension|PixelYDimension|XResolution|YResolution|ResolutionUnit|ExifVersion)$/.test(key)) group = 'image';
    else if (key === 'MakerNote') { group = 'device'; level = 'mid'; }
    items.push({ group: group, key: key, value: String(v), level: level });
  });
  if (t.thumbnail) items.push({ group: 'extra', key: 'Thumbnail', value: '✓', level: 'mid' });
  return items;
}
function orientationOf(t) {
  var e = t.entries.find(function (x) { return x.ifd === 'ifd0' && x.name === 'Orientation'; });
  var v = e && e.value; return typeof v === 'number' && v >= 2 && v <= 8 ? v : 1;
}

/* ---------- JPEG ---------- */
function jpegSegments(u8) {
  if (!(u8[0] === 0xFF && u8[1] === 0xD8)) return null;
  var i = 2, n = u8.length, segs = [], end = -1;
  while (i < n) {
    if (u8[i] !== 0xFF) { i++; continue; }
    var ff = i; while (i < n && u8[i] === 0xFF) i++;
    if (i >= n) break;
    var m = u8[i]; i++;
    if (m === 0xD9) { end = i; break; }
    if (m === 0x00 || m === 0x01 || (m >= 0xD0 && m <= 0xD7)) continue;
    if (i + 2 > n) break;
    var len = (u8[i] << 8) | u8[i + 1];
    if (len < 2 || i + len > n) break;
    var seg = { m: m, start: i - 2, data: i + 2, end: i + len, next: i + len };
    i += len;
    if (m === 0xDA) {
      while (i < n) {
        if (u8[i] === 0xFF) { var nx = u8[i + 1]; if (nx === 0x00 || (nx >= 0xD0 && nx <= 0xD7)) { i += 2; continue; } if (nx === 0xFF) { i++; continue; } break; }
        i++;
      }
      seg.next = i;
    }
    segs.push(seg);
  }
  return { segs: segs, end: end };
}
function jpegKind(u8, s) {
  var id = ascii(u8, s.data, Math.min(s.end, s.data + 32));
  if (s.m === 0xE0) return id.indexOf('JFIF\0') === 0 ? 'jfif' : 'app0';
  if (s.m === 0xE1) return id.indexOf('Exif\0') === 0 ? 'exif' : id.indexOf('http://ns.adobe.com/xap/') === 0 ? 'xmp' : id.indexOf('http://ns.adobe.com/xmp/extension') === 0 ? 'xmp' : 'app1';
  if (s.m === 0xE2) return id.indexOf('ICC_PROFILE\0') === 0 ? 'icc' : 'app2';
  if (s.m === 0xED) return 'iptc';
  if (s.m === 0xEE) return id.indexOf('Adobe') === 0 ? 'adobe' : 'app14';
  if (s.m === 0xFE) return 'comment';
  if (s.m >= 0xE0 && s.m <= 0xEF) return 'app';
  return 'core';
}
function analyzeJpeg(u8) {
  var p = jpegSegments(u8), res = { format: 'jpeg', items: [], orientation: 1, trailing: 0, ok: !!p };
  if (!p) return res;
  p.segs.forEach(function (s) {
    var k = jpegKind(u8, s), size = s.end - s.start;
    if (k === 'exif') { var t = parseTiff(u8, s.data + 6, s.end - s.data - 6); res.items = res.items.concat(exifToItems(t)); res.orientation = orientationOf(t); }
    else if (k === 'xmp') res.items.push({ group: 'extra', key: 'XMP', value: size + ' B', level: 'mid' });
    else if (k === 'iptc') res.items.push({ group: 'extra', key: 'IPTC', value: size + ' B', level: 'mid' });
    else if (k === 'icc') res.items.push({ group: 'extra', key: 'ICC', value: size + ' B', level: 'low' });
    else if (k === 'comment') res.items.push({ group: 'extra', key: 'Comment', value: ascii(u8, s.data, Math.min(s.end, s.data + 120)).replace(/[^\x20-\x7e]/g, '·'), level: 'mid' });
    else if (k === 'app' || k === 'app1' || k === 'app2' || k === 'app0' || k === 'app14') res.items.push({ group: 'extra', key: 'AppSegment', value: 'APP' + (s.m - 0xE0) + ' · ' + size + ' B', level: 'low' });
  });
  if (p.end >= 0 && p.end < u8.length) { res.trailing = u8.length - p.end; res.items.push({ group: 'extra', key: 'TrailingData', value: res.trailing + ' B', level: 'mid' }); }
  return res;
}
function stripJpeg(u8, opts) {
  var p = jpegSegments(u8); if (!p) throw new Error('invalid jpeg');
  var analysis = analyzeJpeg(u8), parts = [Uint8Array.of(0xFF, 0xD8)], inserted = false;
  function exifSeg(o) {
    var tiff = minimalTiff(o), len = 2 + 6 + tiff.length;
    return concat([Uint8Array.of(0xFF, 0xE1, len >> 8, len & 255, 0x45, 0x78, 0x69, 0x66, 0, 0), tiff]);
  }
  var wantExif = opts.keepOrientation && analysis.orientation > 1;
  p.segs.forEach(function (s) {
    var k = jpegKind(u8, s), keep = k === 'core' || k === 'jfif' || k === 'adobe' || (k === 'icc' && opts.keepIcc);
    if (!keep) return;
    if (wantExif && !inserted && k !== 'jfif') { parts.push(exifSeg(analysis.orientation)); inserted = true; }
    parts.push(u8.subarray(s.start, s.next));
  });
  if (wantExif && !inserted) parts.push(exifSeg(analysis.orientation));
  parts.push(Uint8Array.of(0xFF, 0xD9));
  return concat(parts);
}

/* ---------- PNG ---------- */
function pngChunks(u8) {
  var out = [], i = 8, n = u8.length;
  while (i + 12 <= n) {
    var len = ((u8[i] << 24) | (u8[i + 1] << 16) | (u8[i + 2] << 8) | u8[i + 3]) >>> 0, type = ascii(u8, i + 4, i + 8);
    if (i + 12 + len > n) break;
    out.push({ type: type, start: i, data: i + 8, end: i + 8 + len, next: i + 12 + len });
    i += 12 + len;
    if (type === 'IEND') break;
  }
  return out;
}
function utf8(u8, from, to) { try { return new TextDecoder('utf-8').decode(u8.subarray(from, to)); } catch (e) { return ascii(u8, from, to); } }
function analyzePng(u8) {
  var res = { format: 'png', items: [], orientation: 1, trailing: 0, ok: true }, chunks = pngChunks(u8);
  chunks.forEach(function (c) {
    if (c.type === 'tEXt' || c.type === 'zTXt' || c.type === 'iTXt') {
      var z = c.data; while (z < c.end && u8[z] !== 0) z++;
      var key = ascii(u8, c.data, z).slice(0, 40), val = '';
      if (c.type === 'tEXt') val = ascii(u8, z + 1, Math.min(c.end, z + 121));
      else if (c.type === 'iTXt' && u8[z + 1] === 0) { var q = z + 3; for (var r = 0; r < 2 && q < c.end; r++) { while (q < c.end && u8[q] !== 0) q++; q++; } val = utf8(u8, q, Math.min(c.end, q + 120)); }
      else val = '…';
      res.items.push({ group: 'extra', key: 'PNGText', label: key, value: val.replace(/[\u0000-\u001f]/g, ' ').trim() || '…', level: /^(author|copyright|comment|description|software|source|creator)$/i.test(key) ? 'mid' : 'low' });
    } else if (c.type === 'eXIf') {
      var t = parseTiff(u8, c.data, c.end - c.data); res.items = res.items.concat(exifToItems(t)); res.orientation = orientationOf(t);
    } else if (c.type === 'tIME' && c.end - c.data === 7) {
      res.items.push({ group: 'time', key: 'ModifyTime', value: ((u8[c.data] << 8) | u8[c.data + 1]) + '-' + u8[c.data + 2] + '-' + u8[c.data + 3] + ' ' + u8[c.data + 4] + ':' + u8[c.data + 5] + ':' + u8[c.data + 6], level: 'mid' });
    } else if (c.type === 'iCCP') {
      var zz = c.data; while (zz < c.end && u8[zz] !== 0) zz++;
      res.items.push({ group: 'extra', key: 'ICC', value: ascii(u8, c.data, zz).slice(0, 40) + ' · ' + (c.end - c.data) + ' B', level: 'low' });
    }
  });
  var last = chunks[chunks.length - 1];
  if (last && last.type === 'IEND' && last.next < u8.length) { res.trailing = u8.length - last.next; res.items.push({ group: 'extra', key: 'TrailingData', value: res.trailing + ' B', level: 'mid' }); }
  return res;
}
var PNG_KEEP = { IHDR: 1, PLTE: 1, IDAT: 1, IEND: 1, tRNS: 1, gAMA: 1, cHRM: 1, sRGB: 1, sBIT: 1, bKGD: 1, hIST: 1, pHYs: 1, acTL: 1, fcTL: 1, fdAT: 1, cICP: 1 };
function pngChunk(type, data) {
  var out = new Uint8Array(12 + data.length), dv = new DataView(out.buffer);
  dv.setUint32(0, data.length); for (var i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8); dv.setUint32(8 + data.length, crc32(out, 4, 8 + data.length)); return out;
}
function stripPng(u8, opts) {
  var chunks = pngChunks(u8); if (!chunks.length || chunks[0].type !== 'IHDR') throw new Error('invalid png');
  var o = analyzePng(u8).orientation, parts = [u8.subarray(0, 8)], added = false;
  chunks.forEach(function (c, idx) {
    var keep = PNG_KEEP[c.type] || (c.type === 'iCCP' && opts.keepIcc);
    if (!keep) return;
    if (opts.keepOrientation && o > 1 && !added && c.type !== 'IHDR') { parts.push(pngChunk('eXIf', minimalTiff(o))); added = true; }
    parts.push(u8.subarray(c.start, c.next));
  });
  return concat(parts);
}

/* ---------- WebP ---------- */
function webpChunks(u8) {
  var out = [], i = 12, n = u8.length;
  while (i + 8 <= n) {
    var size = (u8[i + 4] | (u8[i + 5] << 8) | (u8[i + 6] << 16) | (u8[i + 7] << 24)) >>> 0, pad = size & 1;
    if (i + 8 + size > n) break;
    out.push({ type: ascii(u8, i, i + 4), data: i + 8, end: i + 8 + size, size: size, next: Math.min(n, i + 8 + size + pad) });
    i += 8 + size + pad;
  }
  return out;
}
function analyzeWebp(u8) {
  var res = { format: 'webp', items: [], orientation: 1, trailing: 0, ok: true };
  webpChunks(u8).forEach(function (c) {
    if (c.type === 'EXIF') {
      var base = ascii(u8, c.data, c.data + 6) === 'Exif\0\0' ? c.data + 6 : c.data;
      var t = parseTiff(u8, base, c.end - base); res.items = res.items.concat(exifToItems(t)); res.orientation = orientationOf(t);
    } else if (c.type === 'XMP ') res.items.push({ group: 'extra', key: 'XMP', value: c.size + ' B', level: 'mid' });
    else if (c.type === 'ICCP') res.items.push({ group: 'extra', key: 'ICC', value: c.size + ' B', level: 'low' });
  });
  return res;
}
function stripWebp(u8, opts) {
  var chunks = webpChunks(u8); if (!chunks.length) throw new Error('invalid webp');
  var o = analyzeWebp(u8).orientation, wantExif = opts.keepOrientation && o > 1, parts = [], hasVp8x = false;
  function chunk(type, data) {
    var pad = data.length & 1, out = new Uint8Array(8 + data.length + pad);
    for (var i = 0; i < 4; i++) out[i] = type.charCodeAt(i);
    out[4] = data.length & 255; out[5] = (data.length >> 8) & 255; out[6] = (data.length >> 16) & 255; out[7] = (data.length >>> 24) & 255;
    out.set(data, 8); return out;
  }
  chunks.forEach(function (c) {
    if (c.type === 'EXIF' || c.type === 'XMP ' || (c.type === 'ICCP' && !opts.keepIcc)) return;
    if (c.type === 'VP8X') {
      hasVp8x = true;
      var d = u8.slice(c.data, c.end);
      d[0] &= ~0x08; d[0] &= ~0x04; if (!opts.keepIcc) d[0] &= ~0x20;
      if (wantExif) d[0] |= 0x08;
      parts.push(chunk('VP8X', d));
      return;
    }
    parts.push(chunk(c.type, u8.subarray(c.data, c.end)));
  });
  if (wantExif && hasVp8x) parts.push(chunk('EXIF', minimalTiff(o)));
  var body = concat(parts), head = new Uint8Array(12);
  head.set([0x52, 0x49, 0x46, 0x46]); var size = 4 + body.length;
  head[4] = size & 255; head[5] = (size >> 8) & 255; head[6] = (size >> 16) & 255; head[7] = (size >>> 24) & 255;
  head.set([0x57, 0x45, 0x42, 0x50], 8);
  return concat([head, body]);
}

function analyze(u8) {
  var f = detectFormat(u8);
  if (f === 'jpeg') return analyzeJpeg(u8);
  if (f === 'png') return analyzePng(u8);
  if (f === 'webp') return analyzeWebp(u8);
  return { format: null, items: [], orientation: 1, trailing: 0, ok: false };
}
function strip(u8, opts) {
  var f = detectFormat(u8); opts = Object.assign({ keepOrientation: true, keepIcc: true }, opts || {});
  if (f === 'jpeg') return stripJpeg(u8, opts);
  if (f === 'png') return stripPng(u8, opts);
  if (f === 'webp') return stripWebp(u8, opts);
  throw new Error('unsupported');
}
/* بعد از حذف چه چیزی باقی مانده؟ (جهت تصویر و پروفایل رنگ مجاز است) */
function residual(items) { return items.filter(function (i) { return i.key !== 'ICC' && i.key !== 'Orientation'; }); }
function summarize(items) {
  return { total: items.length, high: items.filter(function (i) { return i.level === 'hi'; }).length, gps: items.some(function (i) { return i.group === 'gps'; }) };
}
function groupItems(items) {
  var order = ['gps', 'device', 'time', 'owner', 'shooting', 'image', 'other', 'extra'], g = {};
  items.forEach(function (i) { (g[i.group] = g[i.group] || []).push(i); });
  return order.filter(function (k) { return g[k]; }).map(function (k) { return { group: k, items: g[k] }; });
}
function fmtBytes(n, units) {
  if (!(n > 0)) return '0 ' + units[0];
  var i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return Math.round(n / Math.pow(1024, i) * 100) / 100 + ' ' + units[i];
}
function cleanName(name, mime) {
  var base = String(name || 'image').replace(/\.[^./\\]+$/, '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_').trim().slice(0, 80) || 'image';
  return base + '-clean.' + (mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg');
}
/* @logic-end */

var MAX_BYTES = 50 * 1024 * 1024, TYPES = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
var lang = 'fa', dict = {};
try { lang = String(localStorage.getItem('lang') || '').replace(/"/g, '') === 'en' ? 'en' : 'fa'; } catch (e) {}
function t(key, vars) {
  var s = (dict[lang] && dict[lang][key]) || (dict.fa && dict.fa[key]) || key;
  if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
  return s;
}
function nf(n) { return new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US').format(n); }
function $(id) { return document.getElementById(id); }
function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function units() { return [t('u_b'), t('u_kb'), t('u_mb')]; }

var S = { file: null, bytes: null, info: null, previewUrl: '', outUrl: '', method: 'lossless' };
var toastTimer;
function toast(msg, isError) {
  var n = $('toast'); n.textContent = msg; n.className = 'mc-toast' + (isError ? ' is-error' : ''); n.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { n.hidden = true; }, 3000);
}
function applyI18n() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(function (e) { e.textContent = t(e.getAttribute('data-i18n')); });
  document.title = t('title');
  $('methodHelp').textContent = t('help_' + S.method);
  if (S.info) renderMeta();
}
function tagLabel(i) {
  if (i.label) return t('png_text', { k: i.label });
  var l = dict[lang] && dict[lang]['tag_' + i.key]; return l || i.key;
}
function renderMeta() {
  var info = S.info, list = $('metaList'), sum = $('summary'); list.textContent = ''; sum.textContent = '';
  var s = summarize(info.items);
  if (!info.items.length) {
    sum.appendChild(el('span', 'mc-pill mc-pill--ok', t('none_found')));
    list.appendChild(el('p', 'mc-none', t('none_hint')));
    return;
  }
  sum.appendChild(el('span', 'mc-pill', t('count_items', { n: nf(s.total) })));
  if (s.high) sum.appendChild(el('span', 'mc-pill mc-pill--hi', t('count_high', { n: nf(s.high) })));
  if (s.gps) { var w = el('div', 'mc-warn', t('gps_warn')); list.appendChild(w); }
  groupItems(info.items).forEach(function (g) {
    var box = el('section', 'mc-group'); box.appendChild(el('h3', '', t('grp_' + g.group)));
    var rows = el('div', 'mc-rows');
    g.items.forEach(function (i) {
      var r = el('div', 'mc-row ' + i.level); r.appendChild(el('b', '', tagLabel(i)));
      var v = el('span', '', i.value); rows.appendChild(r); r.appendChild(v);
    });
    box.appendChild(rows); list.appendChild(box);
  });
}
function setMethod(m) {
  S.method = m;
  document.querySelectorAll('.mc-seg-btn').forEach(function (b) { var on = b.dataset.method === m; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
  $('methodHelp').textContent = t('help_' + m);
}
function status(msg) { $('status').textContent = msg; }
function resetResult() {
  if (S.outUrl) { URL.revokeObjectURL(S.outUrl); S.outUrl = ''; }
  $('result').hidden = true; $('downloadLink').removeAttribute('href'); status('');
}

async function handleFile(file) {
  resetResult();
  if (!file) return;
  if (file.size > MAX_BYTES) { toast(t('err_size', { n: nf(50) }), true); return; }
  var bytes = new Uint8Array(await file.arrayBuffer()), fmt = detectFormat(bytes);
  if (!fmt) { toast(t('err_type'), true); return; }
  var info;
  try { info = analyze(bytes); } catch (e) { console.error(e); info = { format: fmt, items: [], orientation: 1, ok: false }; }
  S.file = file; S.bytes = bytes; S.info = info;
  if (S.previewUrl) URL.revokeObjectURL(S.previewUrl);
  S.previewUrl = URL.createObjectURL(file);
  $('previewImg').src = S.previewUrl; $('previewImg').alt = file.name; $('preview').hidden = false;
  $('metaSection').hidden = false; $('cleanSection').hidden = false;
  renderMeta();
  if (!info.ok) toast(t('warn_parse'), true);
}
async function redraw(file, fmt) {
  var bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  var c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
  c.getContext('2d').drawImage(bmp, 0, 0); if (bmp.close) bmp.close();
  var mime = TYPES[fmt];
  var blob = await new Promise(function (res) { c.toBlob(res, mime, 0.95); });
  if (!blob) throw new Error('toBlob');
  return new Uint8Array(await blob.arrayBuffer());
}
async function clean() {
  if (!S.bytes) return;
  var btn = $('cleanBtn'); btn.disabled = true; resetResult(); status(t('working'));
  try {
    var fmt = detectFormat(S.bytes), out;
    if (S.method === 'redraw') out = await redraw(S.file, fmt);
    else out = strip(S.bytes, { keepOrientation: $('optOrient').checked, keepIcc: $('optIcc').checked });
    var left = residual(analyze(out).items);
    var mime = S.method === 'redraw' ? (detectFormat(out) ? TYPES[detectFormat(out)] : TYPES[fmt]) : TYPES[fmt];
    S.outUrl = URL.createObjectURL(new Blob([out], { type: mime }));
    var a = $('downloadLink'); a.href = S.outUrl; a.download = cleanName(S.file.name, mime);
    $('sizeBefore').textContent = fmtBytes(S.bytes.length, units()); $('sizeAfter').textContent = fmtBytes(out.length, units());
    $('verifyText').textContent = left.length ? t('verify_left', { n: nf(left.length) }) : t('verify_ok');
    $('result').hidden = false; status(t('done'));
  } catch (e) {
    console.error(e); status(''); toast(t(S.method === 'lossless' ? 'err_lossless' : 'err_clean'), true);
  } finally { btn.disabled = false; }
}

function bind() {
  $('fileInput').addEventListener('change', function (e) { handleFile(e.target.files[0]); });
  var drop = $('drop');
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); }); });
  drop.addEventListener('drop', function (e) { handleFile(e.dataTransfer.files[0]); });
  document.querySelectorAll('.mc-seg-btn').forEach(function (b) { b.addEventListener('click', function () { setMethod(b.dataset.method); resetResult(); }); });
  $('cleanBtn').addEventListener('click', clean);
  window.addEventListener('languageChanged', function (e) { lang = e.detail === 'en' ? 'en' : 'fa'; applyI18n(); });
  window.addEventListener('beforeunload', function () { if (S.previewUrl) URL.revokeObjectURL(S.previewUrl); if (S.outUrl) URL.revokeObjectURL(S.outUrl); });
}
async function boot() {
  try { dict = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  applyI18n(); setMethod('lossless'); bind();
}
document.addEventListener('DOMContentLoaded', boot);
})();
