// Builds www.higherd.de into docs/.  Run:  node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import * as T from './src/templates.mjs';

const { ctx, db, t, p, h } = T;
const root = import.meta.dirname, out = path.join(root, 'docs');
const site = JSON.parse(fs.readFileSync(path.join(root, 'site.json'), 'utf8'));
const extraCss = fs.readFileSync(path.join(root, 'src/site.css'), 'utf8');
const version = '?v=' + site.version;

// ---------- addresses (German at the root, English under /en/) ----------
const servicePath = {
  site: 'digital-construction-management', bim: 'bim-plan-management', flow: 'workflow-automation',
  systems: 'system-integration', recruit: 'engineering-recruiting', teams: 'digital-teams-as-a-service', match: 'talent-matching',
};
const wayPath = { controls: 'project-controls', decision: 'decision-workflow' };
const casePath = {
  approval: 'signature-and-plan-process-management', ai: 'ai-use-in-complex-projects',
  planning: 'strategic-personal-planning', matching: 'matching-key-components',
};
const routes = {
  home: '', solutions: 'solutions/', service: 'higherd-way/', cases: 'our-work/', projects: 'our-work/projects/',
  impact: 'business-impact/', contact: 'contact/',
};
for (const k in db.streams) routes['stream/' + k] = `solution-category/${k}/`;
for (const o of db.offers) {
  routes['offer/' + o.key] = `solution/${o.path}/`;
  routes['service/' + o.key] = `higherd-way/${servicePath[o.key]}/`;
}
for (const w of db.services) routes['way/' + w[0]] = `higherd-way/${wayPath[w[0]]}/`;
for (const c of db.cases) routes['case/' + c[0]] = `our-work/${casePath[c[0]]}/`;

// Legal pages appear, with their footer link, as soon as their text exists in src/legal/
const legal = [['impressum', 'Impressum', 'Legal notice'], ['datenschutz', 'Datenschutz', 'Privacy']]
  .filter(([id]) => ['de', 'en'].every(l => fs.existsSync(path.join(root, `src/legal/${id}.${l}.html`))));
for (const [id] of legal) routes[id] = id + '/';

const address = (id, lang) => (lang === 'en' ? 'en/' : '') + routes[id];

// What an enquiry is about: [English interest value of the lead flow, title DE, title EN]
const streamName = k => db.streams[k][0];
const offerOf = k => db.offers.find(o => o.key === k);
const topics = {};
for (const o of db.offers) topics[o.key] = [streamName(o.stream), ...o.cta];
for (const k in db.streams) topics[k] = [streamName(k), streamName(k), streamName(k)];
for (const w of db.services) topics[w[0]] = [streamName(offerOf(w[5]).stream), ...w[1]];
for (const c of db.cases) topics[c[0]] = [streamName(offerOf(c[3]).stream), ...offerOf(c[3]).cta];
topics.impact = ['Not sure yet', 'Einen Ausgangswert festlegen', 'Establish a baseline'];

// ---------- contact page ----------
function contact() {
  const field = (name, label, type, auto, extra = '') =>
    `<div class="field"><label for="f-${name}">${h(label)} *</label><input id="f-${name}" name="${name}" type="${type}" autocomplete="${auto}" required${extra}><p class="error" id="f-${name}-error"></p></div>`;
  const interests = [...Object.keys(db.streams).map(k => [streamName(k), streamName(k)]), ['Not sure yet', t('Noch nicht sicher', 'Not sure yet')]];
  const texts = {
    name: t('Bitte geben Sie Ihren Namen ein.', 'Please enter your name.'),
    company: t('Bitte geben Sie Ihr Unternehmen ein.', 'Please enter your company name.'),
    email: t('Bitte geben Sie eine gültige E-Mail-Adresse ein.', 'Please enter a valid email address.'),
    phone: t('Bitte geben Sie eine gültige Telefonnummer ein.', 'Please enter a valid phone number.'),
    role: t('Bitte geben Sie Ihre Funktion ein.', 'Please enter your role in the company.'),
    interest: t('Bitte wählen Sie ein Thema aus.', 'Please choose what you are interested in.'),
    message: t('Bitte schreiben Sie uns kurz, worum es geht.', 'Please tell us how we can help.'),
    sending: t('Wird gesendet…', 'Sending…'),
    failed: t('Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.', 'Something went wrong while sending. Please try again.'),
    source: t('Anfrage über higherd.de (DE)', 'Enquiry via higherd.de (EN)'),
  };
  const topicData = Object.fromEntries(Object.entries(topics).map(([k, v]) => [k, [v[0], p(v.slice(1))]]));
  return `<div class="subhead"><div class="k">${t('Kontakt', 'Contact')}</div><h1>${t('Gespräch mit Higherd anfragen', 'Request a conversation with Higherd')}</h1><p class="intro">${t('Bringen Sie ein Arbeitspaket, eine offene Entscheidung oder einen Ressourcenengpass mit.', 'Bring one work package, outstanding decision or capacity gap.')}</p></div>
<section class="section"><form class="card form" id="contact-form" action="${h(site.leadFlow)}" method="POST" novalidate>
<p class="topic" id="topic" hidden><b>${t('Ihr Thema', 'Your topic')}</b><span></span></p>
<div class="g2">${field('name', t('Ihr Name', 'Your name'), 'text', 'name')}${field('company', t('Unternehmen', 'Company name'), 'text', 'organization')}</div>
<div class="g2">${field('email', t('E-Mail', 'Email'), 'email', 'email')}${field('phone', t('Telefon', 'Phone'), 'tel', 'tel')}</div>
<div class="g2">${field('role', t('Ihre Funktion im Unternehmen', 'Role in the company'), 'text', 'organization-title')}<div class="field"><label for="f-interest">${t('Wofür interessieren Sie sich?', 'What is your interest?')} *</label><select id="f-interest" name="interest" required><option value="">${t('Bitte wählen', 'Select')}</option>${interests.map(([v, l]) => `<option value="${h(v)}">${h(l)}</option>`).join('')}</select><p class="error" id="f-interest-error"></p></div></div>
<div class="field"><label for="f-message">${t('Wie können wir helfen?', 'How can we help you?')} *</label><textarea id="f-message" name="message" rows="4" required></textarea><p class="error" id="f-message-error"></p></div>
${legal.some(l => l[0] === 'datenschutz') ? `<p class="small">${t('Wie wir Ihre Angaben verarbeiten, steht in der', 'How we process your details is explained in our')} <a href="${ctx.url('datenschutz')}">${t('Datenschutzerklärung', 'privacy notice')}</a>.</p>` : ''}
<p class="error" id="form-status" role="status" aria-live="polite"></p>
<button class="btn" type="submit">${t('Anfrage senden', 'Send request')}</button>
</form><div class="call" id="form-done" tabindex="-1" hidden><h3>${t('Vielen Dank!', 'Thank you!')}</h3><p>${t('Wir haben Ihre Anfrage erhalten und melden uns in Kürze.', 'We have received your message and will get back to you shortly.')}</p></div></section>
<script type="application/json" id="contact-data">${JSON.stringify({ texts, topics: topicData }).replace(/</g, '\\u003c')}</script>`;
}

const legalPage = id => `<div class="subhead"></div><section class="legal">${fs.readFileSync(path.join(root, `src/legal/${id}.${ctx.lang}.html`), 'utf8')}</section>`;

function content(id) {
  const [k, arg] = id.split('/');
  switch (k) {
    case 'home': return T.home();
    case 'stream': return T.stream(arg);
    case 'offer': return T.offer(arg, false);
    case 'service': return arg ? T.offer(arg, true) : T.list('service');
    case 'way': return T.way(arg);
    case 'case': return T.cs(arg);
    case 'impact': return T.impact();
    case 'projects': return T.projects();
    case 'contact': return contact();
    case 'impressum': case 'datenschutz': return legalPage(k);
    default: return T.list(k);
  }
}

// ---------- page ----------
function page(id, lang) {
  const here = address(id, lang);
  // Relative links, so the site also works under a temporary preview address
  const rel = to => { const up = '../'.repeat(here.split('/').length - 1); return (up + to) || './'; };
  const arg = id.split('/')[1];
  const topic = topics[arg] ? arg : topics[id] ? id : '';
  Object.assign(ctx, {
    lang, url: x => { if (!(x in routes)) throw new Error('No address for ' + x); return rel(address(x, lang)); },
    asset: f => rel('assets/' + f), topicQuery: () => (topic ? '?topic=' + topic : ''),
  });
  const main = content(id);
  const heading = main.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/)?.[1] || 'Higherd';
  const lead = main.match(/<p(?: class="intro")?>([\s\S]*?)<\/p>/)?.[1].replace(/<[^>]+>/g, '') || '';
  const nav = [['solutions', t('Angebote', 'Solutions')], ['service', t('Leistungen', 'Services')], ['cases', 'Our Work'], ['impact', 'ROI']];
  const langLink = l => `<a href="${rel(address(id, l))}" hreflang="${l}" lang="${l}"${l === lang ? ' aria-current="true"' : ''}>${l.toUpperCase()}</a>`;
  const abs = l => h(site.origin + '/' + address(id, l));
  return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${site.index ? '' : '<meta name="robots" content="noindex">'}
<title>${id === 'home' ? 'Higherd | The Higherd Way' : heading + ' | Higherd'}</title>
<meta name="description" content="${lead}">
<link rel="canonical" href="${abs(lang)}">
<link rel="alternate" hreflang="de" href="${abs('de')}"><link rel="alternate" hreflang="en" href="${abs('en')}"><link rel="alternate" hreflang="x-default" href="${abs('de')}">
<link rel="icon" href="${rel('assets/favicon.svg')}" type="image/svg+xml">
<link rel="stylesheet" href="${rel('assets/site.css' + version)}">
</head><body><header><div><a class="brand" href="${rel(address('home', lang))}" aria-label="Higherd"><img src="${rel('assets/Higherd_Official_Logo.svg')}" alt="Higherd" width="110" height="38" style="display:block;width:auto;height:38px"></a><nav id="nav">${nav.map(([k, l]) => `<a href="${ctx.url(k)}">${l}</a>`).join('')}</nav><div class="languages">${langLink('de')}${langLink('en')}</div></div></header><main class="wrap" id="main" tabindex="-1">${main}</main><footer><div id="foot"><span>${t('Higherd Solutions · Projektdarstellungen und Softwaredaten sind illustrativ.', 'Higherd Solutions · Project illustrations and software data are illustrative.')}</span><span class="foot-links"><a href="${ctx.url('contact')}">${t('Kontakt', 'Contact')}</a>${legal.map(([k, de, en]) => `<a href="${ctx.url(k)}">${t(de, en)}</a>`).join('')}</span></div></footer><dialog id="light"><button id="close" aria-label="${t('Schließen', 'Close')}">×</button><img id="big" alt=""><p id="caption"></p></dialog>
<script src="${rel('assets/site.js' + version)}" defer></script>
</body></html>
`;
}

// ---------- write ----------
const keep = new Set(['assets', 'CNAME', '.nojekyll']);
for (const f of fs.readdirSync(out)) if (!keep.has(f)) fs.rmSync(path.join(out, f), { recursive: true });
let count = 0;
for (const lang of ['de', 'en']) for (const id in routes) {
  const file = path.join(out, address(id, lang), 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, page(id, lang));
  count++;
}
fs.writeFileSync(path.join(out, 'assets/site.css'), fs.readFileSync(path.join(root, 'src/package.css'), 'utf8') + extraCss);
fs.copyFileSync(path.join(root, 'src/site.js'), path.join(out, 'assets/site.js'));
// Any unknown address: a small page that leads home
fs.writeFileSync(path.join(out, '404.html'), `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Seite nicht gefunden | Higherd</title><link rel="stylesheet" href="/assets/site.css"></head><body><main class="wrap"><div class="subhead"><h1>Seite nicht gefunden</h1><p class="intro">Page not found</p><a class="btn" href="/">Zur Startseite</a><a class="soft" href="/en/">Home (EN)</a></div></main></body></html>\n`);
fs.writeFileSync(path.join(out, '.nojekyll'), '');
if (site.index) {
  const urls = Object.keys(routes).flatMap(id => ['de', 'en'].map(l => `<url><loc>${site.origin}/${address(id, l)}</loc></url>`));
  fs.writeFileSync(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site.origin}/sitemap.xml\n`);
}
console.log(count + ' pages');
