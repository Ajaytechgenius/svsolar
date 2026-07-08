// ============================================================
// Suryodaya Solar — interactions
// ============================================================

document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Sticky nav background on scroll ---------- */
const nav = document.querySelector('.nav');
function onScroll(){
  if (window.scrollY > 40) nav.classList.add('is-scrolled');
  else nav.classList.remove('is-scrolled');
}
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

/* ---------- Mobile menu ---------- */
const burger = document.getElementById('navBurger');
const navLinks = document.getElementById('navLinks');

function closeMenu(){
  navLinks.classList.remove('is-open');
  burger.classList.remove('is-open');
  burger.setAttribute('aria-expanded', 'false');
}
burger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('is-open');
  burger.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
});
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

/* ---------- Scroll reveal + animated counters ---------- */
const revealEls = document.querySelectorAll('.reveal');
const countedEls = new WeakSet();

function animateCount(el){
  if (countedEls.has(el)) return;
  countedEls.add(el);
  const target = parseFloat(el.dataset.count);
  if (Number.isNaN(target)) return;
  const decimals = parseInt(el.dataset.decimal || '0', 10);
  const suffix = el.dataset.suffix || '';
  const duration = 1400;
  const start = performance.now();

  function tick(now){
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
    el.textContent = (target * eased).toFixed(decimals) + suffix;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = target.toFixed(decimals) + suffix;
  }
  requestAnimationFrame(tick);
}

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    entry.target.querySelectorAll('[data-count]').forEach(animateCount);
    io.unobserve(entry.target);
  });
}, { threshold: 0.18, rootMargin: '0px 0px -60px 0px' });

revealEls.forEach(el => io.observe(el));

/* ---------- Lead form → pre-filled WhatsApp message ---------- */
// Set your WhatsApp number below in the format 91XXXXXXXXXX (no + or spaces)
const WHATSAPP_NUMBER = '917727852619';

const form = document.getElementById('leadForm');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const name = (data.get('name') || '').trim();
  const phone = (data.get('phone') || '').trim();
  const locality = (data.get('locality') || '').trim();
  const bill = data.get('bill');
  const message = (data.get('message') || '').trim();

  const lines = [
    "Hi, I'd like a free solar site visit & subsidy estimate.",
    `Name: ${name}`,
    `Phone: ${phone}`,
    locality ? `Locality: ${locality}` : null,
    `Approx. monthly bill: ${bill}`,
    message ? `Message: ${message}` : null
  ].filter(Boolean).join('\n');

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`;
  window.open(url, '_blank', 'noopener');
});
