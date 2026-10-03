// Theme Manager
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.applyTheme();
    }

    applyTheme() {
        document.body.setAttribute('data-theme', this.currentTheme);
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
        this.applyTheme();
    }

    getTheme() {
        return this.currentTheme;
    }
}

const themeManager = new ThemeManager();

// I18n System
class I18n {
    constructor() {
        this.translations = {};
        this.currentLang = localStorage.getItem('lang') || 'fa';
        this.loadTranslations();
    }

    async loadTranslations() {
        try {
            const response = await fetch('assets/translations.json');
            this.translations = await response.json();
            this.applyTranslations();
        } catch (error) {
            console.error('Failed to load translations:', error);
        }
    }

    t(key) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];
        
        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                return key;
            }
        }
        
        return value;
    }

    applyTranslations() {
        const html = document.documentElement;
        html.setAttribute('lang', this.currentLang);
        html.setAttribute('dir', this.currentLang === 'fa' ? 'rtl' : 'ltr');
        
        // Update all elements with data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' && element.type !== 'checkbox') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // Update document title
        const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
        if (titleKey) {
            document.title = this.t(titleKey);
        }
    }

    switchLanguage() {
        this.currentLang = this.currentLang === 'fa' ? 'en' : 'fa';
        localStorage.setItem('lang', this.currentLang);
        this.applyTranslations();
    }
}

const i18n = new I18n();



// Listen to tool-wrapper theme changes
window.addEventListener('themeChanged', (e) => {
    themeManager.currentTheme = e.detail;
    themeManager.applyTheme();
});

// Listen to tool-wrapper language changes
window.addEventListener('languageChanged', (e) => {
    const newLang = e.detail;
    localStorage.setItem('lang', newLang);
    // Reload page to apply language changes
    location.reload();
});


// Simple client-only social media media extractor + downloader
// Supports: Instagram, Twitter (X), Telegram, LinkedIn via HTML parsing using public CORS proxies

const form = document.getElementById('fetchForm');
const urlInput = document.getElementById('urlInput');
const results = document.getElementById('results');
const proxySelect = document.getElementById('proxySelect');

function setStatus(text, isError=false){
  results.innerHTML = `<div class="card"><strong>${isError? 'خطا' : 'وضعیت'}:</strong> <span>${escapeHtml(text)}</span></div>`;
}

function escapeHtml(s){return s?.toString().replace(/[&<>"];?/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]||c))}

async function fetchProxied(url){
  const proxyBase = proxySelect.value;
  const proxied = proxyBase + encodeURIComponent(url);
  const res = await fetch(proxied);
  if(!res.ok) throw new Error(`پاسخ از پراکسی ${res.status}`);
  return await res.text();
}

function findMeta(doc, prop){
  const m = doc.querySelector(`meta[property="${prop}"]`) || doc.querySelector(`meta[name="${prop}"]`);
  return m?.getAttribute('content') || null;
}

function parseJSONLD(doc){
  const scripts = [...doc.querySelectorAll('script[type="application/ld+json"]')];
  for(const s of scripts){
    try{
      const j = JSON.parse(s.textContent);
      if(Array.isArray(j)){
        for(const item of j){
          if(item && (item['@type']==='VideoObject' || item['@type']==='ImageObject')) return item;
        }
      }else if(j && (j['@type']==='VideoObject' || j['@type']==='ImageObject')) return j;
    }catch(e){/* ignore */}
  }
  return null;
}

function tryExtractMediaFromDoc(doc){
  // prefer video
  const ogVideo = findMeta(doc,'og:video');
  if(ogVideo) return {type:'video',url:ogVideo};
  const twitterPlayer = findMeta(doc,'twitter:player');
  if(twitterPlayer) return {type:'video',url:twitterPlayer};
  const ld = parseJSONLD(doc);
  if(ld){
    if(ld.contentUrl) return {type: ld['@type']==='VideoObject' ? 'video' : 'image', url: ld.contentUrl};
    if(ld.thumbnailUrl) return {type:'image', url: ld.thumbnailUrl};
  }
  const ogImage = findMeta(doc,'og:image');
  if(ogImage) return {type:'image',url:ogImage};
  // check <video> and <img>
  const v = doc.querySelector('video');
  if(v && v.src) return {type:'video',url:v.src};
  const vp = doc.querySelectorAll('video source');
  if(vp.length) return {type:'video',url:vp[0].src};
  const img = doc.querySelector('img');
  if(img && img.src) return {type:'image',url:img.src};
  // anchors to known cdns
  const anchors = [...doc.querySelectorAll('a[href]')];
  for(const a of anchors){
    const h = a.href;
    if(/video\.twimg\.com|cdninstagram|cdn-cgi|media\.tenor\.com|media\.giphy\.com|media\.licdn\.com|telegram\.org|user-images\.githubusercontent/.test(h)){
      const t = /video|gif|mp4|jpg|png/.test(h) ? (/(mp4|webm|mov)/.test(h)?'video':'image') : 'video';
      return {type:t,url:h};
    }
  }
  return null;
}

async function downloadUrlAsBlob(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error(`Failed to download media: ${res.status}`);
  return await res.blob();
}

function makeDownloadLink(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.className='download-link';
  a.textContent = 'دانلود فایل';
  return a;
}

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const input = urlInput.value.trim();
  if(!input) return setStatus('وارد کنید یک URL معتبر', true);
  setStatus('در حال واکشی صفحه...');
  try{
    const html = await fetchProxied(input);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    let media = tryExtractMediaFromDoc(doc);
    if(!media){
      // try embed variants for known hosts
      if(/instagram\.com/.test(input)){
        const embed = input.replace(/\/?$/, '') + 'media/?size=l';
        try{ const embHtml = await fetchProxied(embed); const embDoc = new DOMParser().parseFromString(embHtml,'text/html'); media = tryExtractMediaFromDoc(embDoc);}catch(e){}
      }
      if(!media && /t\.me|telegram\.me/.test(input)){
        const emb = input + '?embed=1';
        try{ const embHtml = await fetchProxied(emb); const embDoc = new DOMParser().parseFromString(embHtml,'text/html'); media = tryExtractMediaFromDoc(embDoc);}catch(e){}
      }
    }
    if(!media) return setStatus('نتوانستم رسانه‌ای پیدا کنم — ممکن است پست خصوصی یا نیاز به پراکسی دیگر داشته باشد.', true);

    // show preview and download
    results.innerHTML = '';
    const card = document.createElement('div'); card.className='card';
    const title = document.createElement('div'); title.innerHTML = `<strong>پیدا شد:</strong> <span>${escapeHtml(media.url)}</span>`;
    card.appendChild(title);

    if(media.type==='image'){
      const img = document.createElement('img'); img.src = media.url; img.className='media-preview'; card.appendChild(img);
    }else{
      const vid = document.createElement('video'); vid.src = media.url; vid.controls=true; vid.className='media-preview'; card.appendChild(vid);
    }

    const dlBtn = document.createElement('button'); dlBtn.textContent='دانلود (پیش‌نمایش)'; dlBtn.style.marginTop='8px';
    dlBtn.addEventListener('click', async ()=>{
      dlBtn.disabled = true; dlBtn.textContent='در حال دانلود...';
      try{
        // fetch via proxy if needed
        const prox = proxySelect.value + encodeURIComponent(media.url);
        const blob = await downloadUrlAsBlob(prox);
        const ext = media.type==='image'? 'jpg' : 'mp4';
        const link = makeDownloadLink(blob, `media.${ext}`);
        card.appendChild(link);
      }catch(err){
        alert('خطا در دانلود: ' + err.message);
      }finally{ dlBtn.disabled = false; dlBtn.textContent='دانلود (پیش‌نمایش)'; }
    });
    card.appendChild(dlBtn);
    results.appendChild(card);

  }catch(err){
    setStatus('خطا: ' + err.message, true);
    console.error(err);
  }
});
