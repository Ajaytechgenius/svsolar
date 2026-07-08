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

/* ---------- Subsidy & savings calculator ---------- */
const calcBill = document.getElementById('calcBill');
if (calcBill) {
  const AVG_TARIFF = 7;       // ₹ per unit, blended estimate
  const GEN_PER_KW_DAY = 4;   // units generated per kW per day
  const COST_PER_KW = 65000;  // ₹ installed cost per kW, before subsidy
  const RING_RADIUS = 92;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

  const tenureButtons = document.querySelectorAll('.calc__tenure-btn');
  let selectedYears = 5;

  function calcSubsidyAmount(kw) {
    let subsidy = Math.min(kw, 2) * 30000;
    if (kw > 2) subsidy += Math.min(kw - 2, 1) * 18000;
    return Math.min(subsidy, 78000);
  }

  function formatINR(n) {
    return '₹' + Math.round(n).toLocaleString('en-IN');
  }

  function updateCalc() {
    const bill = parseInt(calcBill.value, 10);
    document.getElementById('calcBillDisplay').textContent = bill.toLocaleString('en-IN');

    const monthlyUnits = bill / AVG_TARIFF;
    const dailyUnits = monthlyUnits / 30;
    let kw = dailyUnits / GEN_PER_KW_DAY;
    kw = Math.max(1, Math.min(10, Math.round(kw * 2) / 2));

    const subsidy = calcSubsidyAmount(kw);
    const systemCost = kw * COST_PER_KW;
    const netCost = Math.max(systemCost - subsidy, 0);
    const monthlySavings = Math.min(bill, monthlyUnits * AVG_TARIFF);
    const cumulativeSavings = monthlySavings * 12 * selectedYears;
    const covered = subsidy + cumulativeSavings;
    const coveragePct = systemCost > 0 ? Math.min(100, (covered / systemCost) * 100) : 0;

    document.getElementById('calcKw').textContent = `${kw} kW`;
    document.getElementById('calcSubsidy').textContent = formatINR(subsidy);
    document.getElementById('calcNetCost').textContent = formatINR(netCost);
    document.getElementById('calcCumSavings').textContent = formatINR(cumulativeSavings);
    document.getElementById('calcYearsLabel').textContent = `By year ${selectedYears}`;
    document.getElementById('calcCoveragePct').textContent = `${Math.round(coveragePct)}%`;

    const ringFill = document.getElementById('calcRingFill');
    const offset = RING_CIRCUMFERENCE * (1 - coveragePct / 100);
    ringFill.style.strokeDasharray = RING_CIRCUMFERENCE;
    ringFill.style.strokeDashoffset = offset;
  }

  calcBill.addEventListener('input', updateCalc);
  tenureButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tenureButtons.forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      selectedYears = parseInt(btn.dataset.years, 10);
      updateCalc();
    });
  });

  updateCalc();
}

/* ---------- FAQ accordion ---------- */
document.querySelectorAll('.faq-item').forEach((item) => {
  const btn = item.querySelector('.faq-item__q');
  const panel = item.querySelector('.faq-item__a');
  btn.addEventListener('click', () => {
    const isOpen = item.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(isOpen));
    panel.style.maxHeight = isOpen ? panel.scrollHeight + 'px' : null;
  });
});
window.addEventListener('resize', () => {
  document.querySelectorAll('.faq-item.is-open .faq-item__a').forEach((panel) => {
    panel.style.maxHeight = panel.scrollHeight + 'px';
  });
});

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
