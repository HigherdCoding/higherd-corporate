// Enlarge a picture
const light = document.getElementById('light');
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-img]');
  if (!b) return;
  const label = b.getAttribute('aria-label');
  const big = document.getElementById('big');
  big.src = b.querySelector('img').src;
  big.alt = label;
  document.getElementById('caption').textContent = label;
  light.showModal();
});
document.getElementById('close').onclick = () => light.close();

// Keep the chosen topic when the language is switched on the contact page
if (location.search) document.querySelectorAll('.languages a').forEach((a) => { a.search = location.search; });

// Contact form: creates a lead through the same Power Automate flow as hi-gherd.com
const form = document.getElementById('contact-form');
if (form) {
  const { texts, topics } = JSON.parse(document.getElementById('contact-data').textContent);
  const key = new URLSearchParams(location.search).get('topic');
  const topic = Object.hasOwn(topics, key) ? topics[key] : null;
  if (topic) {
    const box = document.getElementById('topic');
    box.querySelector('span').textContent = topic[1];
    box.hidden = false;
    form.elements.interest.value = topic[0];
  }

  const fields = [...form.querySelectorAll('[required]')];
  const problem = (f) => {
    const v = f.value.trim();
    if (!v) return texts[f.name];
    if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return texts.email;
    if (f.type === 'tel' && !/^[0-9 +()\/-]{6,}$/.test(v)) return texts.phone;
    return '';
  };
  const show = (f) => {
    const message = problem(f);
    const error = document.getElementById(f.id + '-error');
    error.textContent = message;
    f.toggleAttribute('aria-invalid', !!message);
    if (message) { f.setAttribute('aria-invalid', 'true'); f.setAttribute('aria-describedby', error.id); } else f.removeAttribute('aria-describedby');
    return message;
  };
  fields.forEach((f) => {
    f.addEventListener('blur', () => { if (f.value.trim()) show(f); });
    f.addEventListener('input', () => { if (f.hasAttribute('aria-invalid')) show(f); });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('form-status');
    status.textContent = '';
    const wrong = fields.filter(show);
    if (wrong.length) { wrong[0].focus(); return; }
    const button = form.querySelector('[type=submit]');
    const label = button.textContent;
    button.disabled = true;
    button.textContent = texts.sending;
    const v = (n) => form.elements[n].value.trim();
    try {
      const r = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Name: v('name'), Company: v('company'), Email: v('email'), Phone: v('phone'), Role: v('role'),
          Interest: v('interest'),
          // keeps the offer the enquiry started from
          More: v('message') + '\n\n' + texts.source + (topic ? ': ' + topic[1] : ''),
        }),
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      form.hidden = true;
      const done = document.getElementById('form-done');
      done.hidden = false;
      done.focus();
    } catch {
      status.textContent = texts.failed;
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  });
}
