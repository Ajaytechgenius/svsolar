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

/* ---------- Basic content protection (deterrent only — see chat note) ---------- */
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  const blocked =
    k === 'f12' ||
    (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(k)) ||
    (e.ctrlKey && k === 'u');
  if (blocked) e.preventDefault();
});
document.querySelectorAll('img, svg').forEach((el) => el.setAttribute('draggable', 'false'));

/* ---------- Interactive dot-grid: dots lift toward the cursor in 3D ---------- */
function initDotGrid(canvas) {
  const ctx = canvas.getContext('2d');
  const spacing = 26;       // matches the static CSS fallback grid
  const reactRadius = 130;  // how far a dot "feels" the cursor
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let w = 0, h = 0, dots = [];
  let mouse = { x: -9999, y: -9999 };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    dots = [];
    for (let y = spacing / 2; y < h; y += spacing) {
      for (let x = spacing / 2; x < w; x += spacing) {
        dots.push({ x, y, scale: 0 });
      }
    }
  }

  function onMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }
  function onLeave() { mouse.x = -9999; mouse.y = -9999; }

  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('resize', resize);
  canvas.addEventListener('mouseleave', onLeave);

  resize();

  function tick() {
    ctx.clearRect(0, 0, w, h);
    for (const d of dots) {
      const dx = d.x - mouse.x;
      const dy = d.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const target = dist < reactRadius ? 1 - dist / reactRadius : 0;
      d.scale += (target - d.scale) * 0.16; // ease toward target = the "settling" feel

      if (d.scale > 0.01) {
        const radius = 1.3 + d.scale * 4.4;
        const lift = d.scale * 6; // moves the dot upward, reading as "popping toward you"
        const r = 201 + (232 - 201) * d.scale;
        const g = 150 + (199 - 150) * d.scale;
        const b = 44 + (122 - 44) * d.scale;

        // soft outer glow for dots that are lifted the most
        if (d.scale > 0.3) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(232,199,122,${(d.scale - 0.3) * 0.35})`;
          ctx.arc(d.x, d.y - lift, radius * 2.4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.25 + d.scale * 0.7})`;
        ctx.arc(d.x, d.y - lift, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

if (
  window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches
) {
  document.querySelectorAll('canvas.hero__pattern').forEach(initDotGrid);
}

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
