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


// Core UI bindings
const qInput = document.getElementById('q');
const searchBtn = document.getElementById('searchBtn');
const resultsEl = document.getElementById('results');
const statusEl = document.getElementById('status');
const deepLinksEl = document.getElementById('deepLinks');
const langListEl = document.getElementById('langList');
const copyJsonBtn = document.getElementById('copyJson');
const openAllBtn = document.getElementById('openAllBtn');

let lastOutput = null;

function containsPersian(text) {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

function detectLangs(name) {
    const langs = ['en', 'fa', 'ar', 'fr', 'de', 'es', 'ru', 'pt', 'zh', 'hi'];
    if (containsPersian(name)) return ['fa', 'en', 'ar', 'fr', 'de', 'es', 'ru', 'pt', 'zh', 'hi'];
    return langs;
}

function setStatus(html) {
    statusEl.innerHTML = html;
}

// Wikipedia search (per language)
async function wikipediaSearch(name, lang) {
    try {
        const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&srlimit=8&format=json&origin=*`;
        const r = await fetch(searchUrl);
        if (!r.ok) return {source: `wikipedia:${lang}`, error: 'HTTP ' + r.status};
        const data = await r.json();
        if (!data.query || !data.query.search || data.query.search.length === 0) return {source: `wikipedia:${lang}`, items: []};
        const ids = data.query.search.map(s => s.pageid).join('|');
        const extractUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts|info&pageids=${ids}&inprop=url&exintro&explaintext&format=json&origin=*`;
        const r2 = await fetch(extractUrl);
        const d2 = await r2.json();
        const items = Object.values(d2.query.pages).map(p => ({
            source: `wikipedia:${lang}`,
            title: p.title,
            snippet: (p.extract || '').slice(0, 800),
            url: p.fullurl || `https://${lang}.wikipedia.org/?curid=${p.pageid}`
        }));
        return {source: `wikipedia:${lang}`, items};
    } catch (err) {
        return {source: `wikipedia:${lang}`, error: err.message};
    }
}

// Wikidata search + optional entity details (claims, coords)
async function wikidataSearch(name) {
    try {
        const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&format=json&limit=10&origin=*`;
        const r = await fetch(url);
        const d = await r.json();
        const items = (d.search || []).map(s => ({source: 'wikidata', title: s.label, description: s.description, id: s.id, url: `https://www.wikidata.org/wiki/${s.id}`}));
        // For the top QID, try to fetch coordinates and sitelinks
        if (items.length > 0) {
            const q = items[0].id;
            try {
                const ent = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${q}.json`).then(r => r.json());
                const e = ent.entities[q];
                const claims = e.claims || {};
                let coord = null;
                if (claims.P625 && claims.P625[0] && claims.P625[0].mainsnak && claims.P625[0].mainsnak.datavalue) {
                    const dv = claims.P625[0].mainsnak.datavalue.value;
                    coord = {lat: dv.latitude, lon: dv.longitude};
                }
                items[0].claims = claims;
                items[0].coord = coord;
                items[0].sitelinks = e.sitelinks || {};
            } catch (e) { /* ignore details error */
            }
        }
        return {source: 'wikidata', items};
    } catch (err) {
        return {source: 'wikidata', error: err.message};
    }
}

// DuckDuckGo Instant Answer via JSONP
function duckDuckGoInstant(name) {
    return new Promise((resolve) => {
        const callbackName = 'ddg_cb_' + Math.random().toString(36).slice(2);
        window[callbackName] = function (data) {
            try {
                const results = [];
                if (data.AbstractURL || data.AbstractText) {
                    results.push({source: 'duckduckgo', title: data.Heading || name, snippet: data.AbstractText || '', url: data.AbstractURL || ''});
                }
                (data.RelatedTopics || []).forEach(t => {
                    if (t.FirstURL) results.push({source: 'duckduckgo', title: t.Text || t.Name || '', snippet: '', url: t.FirstURL});
                });
                resolve({source: 'duckduckgo', items: results});
            } catch (e) {
                resolve({source: 'duckduckgo', error: e.message});
            }
            script.remove();
            try {
                delete window[callbackName];
            } catch (e) {
            }
        };
        const script = document.createElement('script');
        script.src = `https://api.duckduckgo.com/?q=${encodeURIComponent(name)}&format=json&pretty=1&no_html=1&skip_disambig=1&callback=${callbackName}`;
        script.onerror = () => {
            resolve({source: 'duckduckgo', error: 'network/script error'});
            script.remove();
            try {
                delete window[callbackName];
            } catch (e) {
            }
        };
        document.body.appendChild(script);
    });
}

// OpenStreetMap Nominatim geocoding (no-key, public)
async function osmGeocode(name) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=6&addressdetails=1`;
        const r = await fetch(url, {headers: {'Accept': 'application/json'}});
        if (!r.ok) return {source: 'osm', error: 'HTTP ' + r.status};
        const d = await r.json();
        const items = d.map(it => ({
            source: 'osm',
            display_name: it.display_name,
            lat: it.lat,
            lon: it.lon,
            type: it.type,
            osm_id: it.osm_id,
            url: `https://www.openstreetmap.org/?mlat=${it.lat}&mlon=${it.lon}#map=18/${it.lat}/${it.lon}`
        }));
        return {source: 'osm', items};
    } catch (err) {
        return {source: 'osm', error: err.message};
    }
}

// Wayback availability (CDX API) - checks snapshots for main domains
async function waybackCheck(urls) {
    // Accept array of URLs and call archive.org wayback availability for each (CORS-friendly)
    try {
        if (!urls || urls.length === 0) return {source: 'wayback', items: []};
        const checks = await Promise.all(urls.slice(0, 12).map(async u => {
            try {
                const api = `https://archive.org/wayback/available?url=${encodeURIComponent(u)}`;
                const r = await fetch(api);
                if (!r.ok) return {url: u, error: 'HTTP ' + r.status};
                const d = await r.json();
                if (d && d.archived_snapshots && d.archived_snapshots.closest) {
                    const snap = d.archived_snapshots.closest;
                    return {url: u, available: true, timestamp: snap.timestamp, snapshot_url: snap.url};
                }
                return {url: u, available: false};
            } catch (e) {
                return {url: u, error: e.message};
            }
        }));
        return {source: 'wayback', items: checks};
    } catch (err) {
        return {source: 'wayback', error: err.message};
    }
}

// GitHub search (public repos/users) - limited unauthenticated
async function githubSearch(name) {
    try {
        const q = encodeURIComponent(name);
        const r = await fetch(`https://api.github.com/search/users?q=${q}&per_page=6`);
        if (!r.ok) return {source: 'github', error: 'HTTP ' + r.status};
        const d = await r.json();
        const items = (d.items || []).map(u => ({source: 'github', login: u.login, url: u.html_url, score: u.score, avatar: u.avatar_url}));
        return {source: 'github', items};
    } catch (err) {
        return {source: 'github', error: err.message};
    }
}

// StackExchange search (StackOverflow etc.)
async function stackexchangeSearch(name) {
    try {
        const q = encodeURIComponent(name);
        const r = await fetch(`https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${q}&site=stackoverflow&pagesize=6`);
        const d = await r.json();
        const items = (d.items || []).map(i => ({source: 'stackexchange', title: i.title, url: i.link, score: i.score}));
        return {source: 'stackexchange', items};
    } catch (err) {
        return {source: 'stackexchange', error: err.message};
    }
}

// New: categorized OSINT resources (name, category, template)
const RESOURCES = [
  // موتورهای جستجو
  {name:'Google', cat:'موتورهای جستجو', url:'https://www.google.com/search?q={q}', desc:'جستجوی عمومی وب'},
  {name:'Bing', cat:'موتورهای جستجو', url:'https://www.bing.com/search?q={q}', desc:'موتور جستجوی مایکروسافت'},
  {name:'DuckDuckGo', cat:'موتورهای جستجو', url:'https://duckduckgo.com/?q={q}', desc:'جستجوی حریم‌محور'},
  {name:'Yandex', cat:'موتورهای جستجو', url:'https://yandex.com/search/?text={q}', desc:'موتور جستجوی روسی'},

  // شبکه‌های اجتماعی
  {name:'Twitter (search)', cat:'شبکه‌های اجتماعی', url:'https://twitter.com/search?q={q}', desc:'جستجوی توییت‌ها و پروفایل‌ها'},
  {name:'Facebook search', cat:'شبکه‌های اجتماعی', url:'https://www.facebook.com/search/top/?q={q}', desc:'جستجوی عمومی در فیسبوک'},
  {name:'Instagram (web)', cat:'شبکه‌های اجتماعی', url:'https://www.instagram.com/web/search/topsearch/?query={q}', desc:'جستجو در اینستاگرام (وب)'},
  {name:'Telegram (web)', cat:'شبکه‌های اجتماعی', url:'https://t.me/s/{q}', desc:'جستجوی کانال‌ها و پست‌ها در تلگرام (وب)'},

  // افراد
  {name:'LinkedIn People', cat:'افراد', url:'https://www.linkedin.com/search/results/people/?keywords={q}', desc:'جستجوی افراد در لینکدین'},
  {name:'Pipl', cat:'افراد', url:'https://pipl.com/search/?q={q}', desc:'جستجوی افراد (سرویس تجاری، ممکن است محدودیت داشته باشد)'},
  {name:'TrueCaller', cat:'افراد', url:'https://www.truecaller.com/search/{q}', desc:'جستجوی شماره تلفن (وب ممکن است محدودیت داشته باشد)'},

  // کد و مخازن
  {name:'GitHub', cat:'کد/مخازن', url:'https://github.com/search?q={q}', desc:'جستجوی مخازن، کاربران و کد'},
  {name:'GitLab', cat:'کد/مخازن', url:'https://gitlab.com/search?search={q}', desc:'جستجو در GitLab'},

  // تصاویر و ویدیو
  {name:'Google Images', cat:'تصاویر/ویدیو', url:'https://www.google.com/search?tbm=isch&q={q}', desc:'جستجوی عکس‌ها'},
  {name:'Bing Images', cat:'تصاویر/ویدیو', url:'https://www.bing.com/images/search?q={q}', desc:'جستجوی تصویر از بینگ'},
  {name:'TinEye (reverse image)', cat:'تصاویر/ویدیو', url:'https://tineye.com/search?url={q}', desc:'جستجوی معکوس تصویر (با URL تصویر)'},
  {name:'YouTube', cat:'تصاویر/ویدیو', url:'https://www.youtube.com/results?search_query={q}', desc:'جستجوی ویدیو در یوتیوب'},
  {name:'InVID (verification)', cat:'تصاویر/ویدیو', url:'https://www.invid-project.eu/tools-and-services/invid-verification-plugin/', desc:'ابزارهای تایید ویدیو/تصویر'},

  // آرشیوها
  {name:'Wayback (archive.org)', cat:'بایگانی‌ها', url:'https://web.archive.org/web/*/{q}', desc:'نسخه‌های آرشیوی صفحات وب'},
  {name:'Archive.today', cat:'بایگانی‌ها', url:'https://archive.today/?q={q}', desc:'ذخیره و مشاهده اسنپ‌شات صفحات'},

  // مکان‌یابی
  {name:'Google Maps', cat:'مکان‌یابی', url:'https://www.google.com/maps/search/{q}', desc:'پیدا کردن مکان‌ها در گوگل‌مپ'},
  {name:'OpenStreetMap', cat:'مکان‌یابی', url:'https://www.openstreetmap.org/search?query={q}', desc:'جستجوی مکان در OSM'},
  {name:'Wikimapia', cat:'مکان‌یابی', url:'https://wikimapia.org/#lat=0&lon=0&z=1&search={q}', desc:'پلتفرم توصیف مکان‌ها'},

  // متادیتا / EXIF
  {name:'Exif.tools', cat:'متادیتا', url:'https://exif.tools/?q={q}', desc:'بررسی metadata تصاویر (مثال برای URL تصویر)'},
  {name:'FotoForensics', cat:'متادیتا', url:'https://fotoforensics.com/', desc:'تحلیل تصاویر و تشخیص دستکاری (آپلود لازم است)'},

  // Paste / نشت داده
  {name:'Pastebin search', cat:'پست/نشت‌ها', url:'https://pastebin.com/search?q={q}', desc:'جستجوی محتوا در Pastebin'},
  {name:'GitHub code search', cat:'پست/نشت‌ها', url:'https://github.com/search?q={q}+filename%3Adump', desc:'جستجوی احتمالی داده‌های لو رفته در GitHub'},

  // شبکه ها و WHOIS
  {name:'Whois Lookup', cat:'شبکه‌ها / WHOIS', url:'https://who.is/whois/{q}', desc:'اطلاعات ثبت دامنه'},
  {name:'Shodan', cat:'شبکه‌ها / WHOIS', url:'https://www.shodan.io/search?query={q}', desc:'جستجوی دستگاه‌ها و سرویس‌های آنلاین (شاید نیاز به حساب)'},

  // متفرقه و ابزارها
  {name:'Wikidata', cat:'متفرقه', url:'https://www.wikidata.org/w/index.php?search={q}', desc:'داده‌های ساخت‌یافته و QIDها'},
  {name:'Wikipedia (en)', cat:'متفرقه', url:'https://en.wikipedia.org/w/index.php?search={q}', desc:'مقالات انگلیسی و اطلاعات عمومی'},
  {name:'StackOverflow', cat:'متفرقه', url:'https://stackoverflow.com/search?q={q}', desc:'پرسش و پاسخ فنی'},
  {name:'Google Advanced (filetype)', cat:'متفرقه', url:'https://www.google.com/search?q={q}+filetype:pdf', desc:'جستجوی فایل‌ها با فرمت مشخص'}
];

// Render the resources panel grouped by category
function renderResourcesPanel(query){
  const panel = document.getElementById('resourcesPanel');
  if(!panel) return;
  panel.innerHTML = '';
  const grouped = RESOURCES.reduce((acc,r)=>{ (acc[r.cat] = acc[r.cat]||[]).push(r); return acc; }, {});
  Object.keys(grouped).forEach(cat=>{
    const wrap = document.createElement('div'); wrap.className = 'resource-category';
    const header = document.createElement('div'); header.className = 'category-header';
    const title = document.createElement('div'); title.className = 'category-title'; title.textContent = cat + ` (${grouped[cat].length})`;
    const actions = document.createElement('div'); actions.className = 'category-actions';
    const openAllBtn = document.createElement('button'); openAllBtn.className='secondary'; openAllBtn.textContent='باز کردن همه';
    openAllBtn.addEventListener('click', ()=>{
      grouped[cat].forEach(r=>{ const u = r.url.replace('{q}', encodeURIComponent(query||'')); window.open(u,'_blank'); });
    });
    actions.appendChild(openAllBtn);
    header.appendChild(title); header.appendChild(actions);
    wrap.appendChild(header);

    // search inside category
    const rs = document.createElement('div'); rs.className='resource-search';
    const rin = document.createElement('input'); rin.placeholder = 'جستجوی این دسته...';
    const rbtn = document.createElement('button'); rbtn.className='secondary'; rbtn.textContent='فیلتر';
    rs.appendChild(rin); rs.appendChild(rbtn);
    wrap.appendChild(rs);

    const list = document.createElement('div'); list.className='resource-list';
    function renderList(filter){ list.innerHTML=''; (grouped[cat].filter(r=>!filter||r.name.toLowerCase().includes(filter.toLowerCase())|| (r.desc||'').toLowerCase().includes(filter.toLowerCase())).forEach(r=>{
      const a = document.createElement('a'); a.href = r.url.replace('{q}', encodeURIComponent(query||'')); a.target='_blank'; a.rel='noopener'; a.className='chip'; a.title = r.desc; a.textContent = r.name; list.appendChild(a);
    })); }
    renderList('');
    rbtn.addEventListener('click', ()=>{ renderList(rin.value.trim()) });
    rin.addEventListener('keydown', (e)=>{ if(e.key==='Enter') renderList(rin.value.trim()); });

    wrap.appendChild(list);
    panel.appendChild(wrap);
  });
}

// Call renderResourcesPanel whenever we build deep links or update the query
function buildDeepLinks(name){
  const enc = encodeURIComponent(name);
  const flat = [
    {label:'Google', url:`https://www.google.com/search?q=${enc}`},
    {label:'Bing', url:`https://www.bing.com/search?q=${enc}`},
    {label:'DuckDuckGo', url:`https://duckduckgo.com/?q=${enc}`},
    {label:'Yandex', url:`https://yandex.com/search/?text=${enc}`},
    {label:'GitHub', url:`https://github.com/search?q=${enc}`},
    {label:'Twitter (Advanced)', url:`https://twitter.com/search?q=${enc}`},
    {label:'LinkedIn (People)', url:`https://www.linkedin.com/search/results/people/?keywords=${enc}`},
    {label:'Pastebin', url:`https://pastebin.com/search?q=${enc}`},
    {label:'StackOverflow', url:`https://stackoverflow.com/search?q=${enc}`},
    {label:'Google Images', url:`https://www.google.com/search?tbm=isch&q=${enc}`},
    {label:'YouTube', url:`https://www.youtube.com/results?search_query=${enc}`}
  ];
  // Also update the resources panel
  renderResourcesPanel(name);
  return flat;
}

function renderDeepLinks(links) {
    deepLinksEl.innerHTML = '';
    links.forEach(l => {
        const a = document.createElement('a');
        a.href = l.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.className = 'chip';
        a.textContent = l.label;
        deepLinksEl.appendChild(a);
    });
}

function renderLangList(langs) {
    langListEl.innerHTML = '';
    langs.forEach(l => {
        const s = document.createElement('div');
        s.className = 'chip';
        s.textContent = l;
        langListEl.appendChild(s);
    });
}

function renderResults(aggregated) {
    lastOutput = aggregated;
    if (!aggregated || aggregated.length === 0) {
        resultsEl.innerHTML = '<div class="small">نتیجه‌ای پیدا نشد.</div>';
        return;
    }
    const out = document.createElement('div');
    aggregated.forEach(group => {
        if (group.error) {
            const e = document.createElement('div');
            e.className = 'error';
            e.textContent = `${group.source}: ${group.error}`;
            out.appendChild(e);
            return;
        }
        if (!group.items || group.items.length === 0) return;
        const header = document.createElement('div');
        header.className = 'small meta';
        header.textContent = group.source;
        out.appendChild(header);
        const ul = document.createElement('ul');
        ul.className = 'list';
        group.items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'result';
            const a = document.createElement('a');
            a.href = item.url || '#';
            a.className = 'target';
            a.target = '_blank';
            a.rel = 'noopener';
            a.textContent = item.title || item.label || item.name || item.login || item.display_name || item.url || '(no title)';
            const meta = document.createElement('div');
            meta.className = 'meta';
            meta.textContent = item.url || (item.description || '');
            const p = document.createElement('div');
            p.className = 'small';
            p.textContent = item.snippet || item.description || '';
            li.appendChild(a);
            li.appendChild(meta);
            if (item.lat && item.lon) {
                const geo = document.createElement('div');
                geo.className = 'geo';
                geo.textContent = `مختصات: ${item.lat}, ${item.lon}`;
                li.appendChild(geo);
            }
            if (item.coord) {
                const geo = document.createElement('div');
                geo.className = 'geo';
                geo.textContent = `مختصات (wikidata): ${item.coord.lat}, ${item.coord.lon}`;
                li.appendChild(geo);
            }
            if (item.login) {
                const img = document.createElement('img');
                img.src = item.avatar;
                img.className = 'avatar';
                li.prepend(img);
            }
            li.appendChild(p);
            ul.appendChild(li);
        });
        out.appendChild(ul);
    });
    resultsEl.innerHTML = '';
    resultsEl.appendChild(out);
}

function safeFileName(name) {
    return name.replace(/[^a-z0-9_\u0600-\u06FF.\-]/ig, '_').slice(0, 120) || 'osint_result';
}

async function doSearch(name) {
    if (!name || !name.trim()) return;
    setStatus('<span class="spinner"></span> در حال جستجو...');
    const langs = detectLangs(name);
    renderLangList(langs);
    const deepLinks = buildDeepLinks(name);
    renderDeepLinks(deepLinks);

    // Run searches in parallel: Wikipedia per language, wikidata, duckduckgo, osm, github, stackexchange
    const wikiPromises = langs.map(l => wikipediaSearch(name, l));
    const ddgPromise = duckDuckGoInstant(name);
    const wdPromise = wikidataSearch(name);
    const osmPromise = osmGeocode(name);
    const ghPromise = githubSearch(name);
    const sePromise = stackexchangeSearch(name);

    const results = await Promise.all([...wikiPromises, ddgPromise, wdPromise, osmPromise, ghPromise, sePromise]);

    // Collect candidate URLs for Wayback (take URLs from wiki, wikidata, ddg)
    const candidateUrls = new Set();
    results.forEach(group => {
        if (group && group.items) {
            group.items.forEach(it => {
                const u = it.url || it.snapshot_url || it.html_url || it.link;
                if (u) candidateUrls.add(u);
            });
        }
    });
    const urls = Array.from(candidateUrls).slice(0, 12);
    const wb = await waybackCheck(urls);
    const aggregated = [...results, wb];

    setStatus('تمام شد — نتایج بارگذاری شدند');
    renderResults(aggregated);
}

searchBtn.addEventListener('click', () => {
    doSearch(qInput.value.trim());
});
qInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch(qInput.value.trim());
});

copyJsonBtn.addEventListener('click', () => {
    if (!lastOutput) return alert('نتیجه‌ای برای کپی وجود ندارد.');
    const json = JSON.stringify(lastOutput, null, 2);
    navigator.clipboard.writeText(json).then(() => alert('JSON کپی شد.'), () => alert('کپی ناموفق.'));
});

// Download JSON button
const downloadJsonBtn = document.getElementById('downloadJson');
downloadJsonBtn.addEventListener('click', () => {
    if (!lastOutput) return alert('نتیجه‌ای برای دانلود وجود ندارد.');
    const json = JSON.stringify(lastOutput, null, 2);
    const blob = new Blob([json], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const q = (qInput.value || 'result').trim();
    a.href = url;
    a.download = safeFileName(q) + '_osint.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
});

openAllBtn.addEventListener('click', () => {
    const name = qInput.value.trim();
    if (!name) return alert('ابتدا نام را وارد کنید.');
    const links = buildDeepLinks(name);
    let opened = 0;
    links.forEach(l => {
        try {
            window.open(l.url, '_blank');
            opened++;
        } catch (e) {
        }
    });
    if (opened === 0) alert('مرورگر شما ممکن است پاپ‌آپ‌ها را مسدود کرده باشد. لینک‌ها را از پنل سمت راست باز کنید.');
});

// expose for debugging
window.__osint = {doSearch, renderResults};
