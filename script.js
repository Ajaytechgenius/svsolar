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
    document.getElementById('calcYearsLabel').textContent =
      window.currentLang === 'hi' ? `वर्ष ${selectedYears} तक` : `By year ${selectedYears}`;
    document.getElementById('calcCoveragePct').textContent = `${Math.round(coveragePct)}%`;

    const ringFill = document.getElementById('calcRingFill');
    const offset = RING_CIRCUMFERENCE * (1 - coveragePct / 100);
    ringFill.style.strokeDasharray = RING_CIRCUMFERENCE;
    ringFill.style.strokeDashoffset = offset;
  }

  calcBill.addEventListener('input', updateCalc);
  window.refreshCalcLang = updateCalc;
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

/* ============================================================
   Language toggle — English / Hindi
   ============================================================ */
const translations = {
  nav_brand: { en: 'Shree Vinayak <em>Solar</em>', hi: 'श्री विनायक <em>सोलर</em>' },
  nav_why: { en: 'Why Solar', hi: 'सोलर क्यों' },
  nav_subsidy: { en: 'Subsidy', hi: 'सब्सिडी' },
  nav_calculator: { en: 'Calculator', hi: 'कैलकुलेटर' },
  nav_services: { en: 'Services', hi: 'सेवाएं' },
  nav_faq: { en: 'FAQ', hi: 'सामान्य प्रश्न' },
  nav_contact: { en: 'Contact', hi: 'संपर्क करें' },
  nav_cta: { en: 'Free Site Visit', hi: 'मुफ़्त साइट विज़िट' },

  hero_eyebrow: { en: 'Shree Vinayak Solar Agency (SVSOLAR) · Sikar, Rajasthan', hi: 'श्री विनायक सोलर एजेंसी (SVSOLAR) · सीकर, राजस्थान' },
  hero_title_1: { en: "Turn Rajasthan's Sunshine Into", hi: 'राजस्थान की धूप को बदलिए' },
  hero_title_2: { en: 'Zero Electricity Bills.', hi: 'ज़ीरो बिजली बिल में।' },
  hero_sub: {
    en: 'We design, install, and manage your entire PM Surya Ghar subsidy paperwork —\n      so up to <strong>₹78,000</strong> comes back to your bank account, and you get up to\n      <strong>300 units of free electricity</strong> every month.',
    hi: 'हम आपके पूरे PM सूर्य घर सब्सिडी के कागज़ी काम की ज़िम्मेदारी लेते हैं — जिससे आपके बैंक खाते में <strong>₹78,000 तक</strong> वापस आते हैं, और हर महीने <strong>300 यूनिट तक मुफ़्त बिजली</strong> मिलती है।'
  },
  hero_cta1: { en: 'Check My Free Subsidy Amount', hi: 'मेरी मुफ़्त सब्सिडी राशि जानें' },
  hero_cta2: { en: 'Call Now', hi: 'अभी कॉल करें' },
  hero_trust1: { en: '<strong>500+</strong> Homes Powered', hi: '<strong>500+</strong> घरों में सोलर' },
  hero_trust2: { en: '<strong>4.2 MW+</strong> Installed', hi: '<strong>4.2 MW+</strong> इंस्टॉल' },
  hero_trust3: { en: 'Free, No-Obligation Quotes', hi: 'मुफ़्त, बिना किसी बाध्यता के कोटेशन' },

  why_eyebrow: { en: 'Why Now', hi: 'अभी क्यों' },
  why_title: { en: "The Sun Already Pays Your Electricity Bill.<br>You're Just Not Collecting It Yet.", hi: 'सूरज पहले से ही आपका बिजली बिल भर रहा है।<br>बस आप अभी तक इसे वसूल नहीं रहे।' },
  why1_title: { en: 'Government Pays a Share', hi: 'सरकार हिस्सा देती है' },
  why1_desc: { en: 'Up to ₹78,000 subsidy credited directly to your bank account under PM Surya Ghar Muft Bijli Yojana — no middlemen, no hidden cuts.', hi: 'PM सूर्य घर मुफ़्त बिजली योजना के तहत ₹78,000 तक की सब्सिडी सीधे आपके बैंक खाते में — कोई बिचौलिया नहीं, कोई छुपा कटौती नहीं।' },
  why2_title: { en: 'Bills Drop to Near-Zero', hi: 'बिल लगभग ज़ीरो हो जाता है' },
  why2_desc: { en: 'Generate up to 300 free units a month and export surplus power back to the grid through net metering.', hi: 'हर महीने 300 यूनिट तक मुफ़्त बिजली बनाएं और नेट मीटरिंग के ज़रिए बची हुई बिजली ग्रिड को वापस बेचें।' },
  why3_title: { en: 'It Pays for Itself', hi: 'यह अपनी लागत खुद निकाल लेता है' },
  why3_desc: { en: 'Most Sikar-area homes recover their investment in 4–6 years, then generate free power for two decades more.', hi: 'सीकर क्षेत्र के ज़्यादातर घर 4–6 सालों में अपना निवेश वसूल कर लेते हैं, फिर अगले 20 साल तक मुफ़्त बिजली मिलती रहती है।' },

  subsidy_eyebrow: { en: 'Government of India · PM Surya Ghar Muft Bijli Yojana', hi: 'भारत सरकार · PM सूर्य घर मुफ़्त बिजली योजना' },
  subsidy_title: { en: "Here's Exactly What The Government Gives Back", hi: 'सरकार आपको बिल्कुल यही वापस देती है' },
  subsidy_lead: { en: 'Subsidy is disbursed in central financial assistance based on your rooftop system size.', hi: 'सब्सिडी आपके रूफटॉप सिस्टम के साइज़ के अनुसार केंद्रीय वित्तीय सहायता के रूप में दी जाती है।' },
  subsidy_bar1_label: { en: 'Up to 1 kW', hi: '1 kW तक' },
  subsidy_bar2_label: { en: '2 kW system', hi: '2 kW सिस्टम' },
  subsidy_bar3_label: { en: '3 kW & above (max)', hi: '3 kW व उससे ऊपर (अधिकतम)' },
  subsidy_note: { en: '+ up to <strong>300 units of free electricity every month</strong>, credited via net metering with your local DISCOM.', hi: '+ आपके स्थानीय DISCOM के साथ नेट मीटरिंग के ज़रिए हर महीने <strong>300 यूनिट तक मुफ़्त बिजली</strong>।' },
  subsidy_footer_p: {
    en: 'Subsidy is typically disbursed to your bank account within 30–45 days of commissioning. Figures shown follow current PM Surya Ghar guidelines and may be revised by MNRE — we confirm the exact figure with every quote. Official portal: <span class="nowrap">pmsuryaghar.gov.in</span>',
    hi: 'सब्सिडी आमतौर पर कमीशनिंग के 30–45 दिनों के भीतर आपके बैंक खाते में आ जाती है। दिखाए गए आंकड़े मौजूदा PM सूर्य घर दिशानिर्देशों के अनुसार हैं और MNRE द्वारा संशोधित किए जा सकते हैं — हम हर कोटेशन के साथ सही आंकड़ा कन्फर्म करते हैं। आधिकारिक पोर्टल: <span class="nowrap">pmsuryaghar.gov.in</span>'
  },
  subsidy_cta: { en: 'We Guide You Through the Paperwork →', hi: 'हम आपको पूरा कागज़ी काम समझाते हैं →' },

  calc_eyebrow: { en: 'Instant Estimate', hi: 'तुरंत अनुमान' },
  calc_title: { en: 'See Your Own Numbers', hi: 'अपने आंकड़े खुद देखें' },
  calc_lead: { en: 'Set your bill and a timeline — watch how much of your investment gets covered by the subsidy plus your savings. A planning guide, not a quote.', hi: 'अपना बिल और समय सीमा सेट करें — देखें कि सब्सिडी और बचत मिलाकर आपका कितना निवेश कवर होता है। यह एक योजना गाइड है, कोटेशन नहीं।' },
  calc_bill_label: { en: 'Approx. monthly electricity bill', hi: 'लगभग मासिक बिजली बिल' },
  calc_tenure_label: { en: 'Track coverage over', hi: 'इतने समय में कवरेज देखें' },
  calc_tenure_3: { en: '3 yrs', hi: '3 साल' },
  calc_tenure_5: { en: '5 yrs', hi: '5 साल' },
  calc_tenure_10: { en: '10 yrs', hi: '10 साल' },
  calc_tenure_15: { en: '15 yrs', hi: '15 साल' },
  calc_stat1_label: { en: 'System Size', hi: 'सिस्टम साइज़' },
  calc_stat2_label: { en: 'Govt. Subsidy', hi: 'सरकारी सब्सिडी' },
  calc_stat3_label: { en: 'Net Investment', hi: 'शुद्ध निवेश' },
  calc_ring_caption: { en: 'of investment covered', hi: 'निवेश कवर हुआ' },
  calc_cumtext: { en: '· cumulative savings ', hi: '· कुल बचत ' },
  calc_disclaimer: {
    en: "Assumes a blended tariff of ~₹7/unit, ~4 units generated per kW per day (typical for Rajasthan's high solar irradiance), and an installed cost of ~₹65,000/kW before subsidy — all figures vary by roof, shading, equipment choice, and your actual DISCOM tariff. This is an indicative planning tool, not a quotation. <a href=\"#contact\">Get your exact numbers →</a>",
    hi: 'अनुमान ~₹7/यूनिट टैरिफ, ~4 यूनिट प्रति kW प्रतिदिन (राजस्थान की तेज़ धूप के अनुसार सामान्य), और सब्सिडी से पहले ~₹65,000/kW की इंस्टॉलेशन लागत पर आधारित है — असली आंकड़े छत, छाया, उपकरण और आपके DISCOM टैरिफ के अनुसार बदल सकते हैं। यह एक सांकेतिक योजना उपकरण है, कोटेशन नहीं। <a href="#contact">अपने सटीक आंकड़े जानें →</a>'
  },

  services_eyebrow: { en: 'What We Do', hi: 'हम क्या करते हैं' },
  services_title: { en: 'End-to-End Solar, Handled by One Team', hi: 'शुरू से आख़िर तक सोलर, एक ही टीम द्वारा' },
  svc1_title: { en: 'Residential Rooftop Solar', hi: 'रेज़िडेंशियल रूफटॉप सोलर' },
  svc1_desc: { en: 'Custom-sized systems for homes, from 1 kW to 10 kW+, matched to your roof and consumption.', hi: 'घरों के लिए कस्टम साइज़ सिस्टम, 1 kW से 10 kW+ तक, आपकी छत और बिजली खपत के अनुसार।' },
  svc2_title: { en: 'Subsidy & DISCOM Paperwork', hi: 'सब्सिडी और DISCOM कागज़ी काम' },
  svc2_desc: { en: 'We guide your PM Surya Ghar application and help you liaise with your local DISCOM.', hi: 'हम आपके PM सूर्य घर आवेदन में मदद करते हैं और आपके स्थानीय DISCOM से बातचीत में सहायता करते हैं।' },
  svc3_title: { en: 'Net Metering Setup', hi: 'नेट मीटरिंग सेटअप' },
  svc3_desc: { en: 'Sell surplus power back to the grid and watch your meter run backward on sunny days.', hi: 'बची हुई बिजली ग्रिड को बेचें और धूप वाले दिनों में अपना मीटर उल्टा चलते देखें।' },
  svc4_title: { en: 'Annual Maintenance (AMC)', hi: 'वार्षिक रखरखाव (AMC)' },
  svc4_desc: { en: 'Scheduled panel cleaning, inverter checks, and performance monitoring after installation.', hi: 'इंस्टॉलेशन के बाद निर्धारित पैनल सफ़ाई, इन्वर्टर जांच और परफ़ॉर्मेंस मॉनिटरिंग।' },
  svc5_title: { en: 'Commercial & Society Installs', hi: 'कमर्शियल और सोसाइटी इंस्टॉलेशन' },
  svc5_desc: { en: 'Larger systems for shops, offices, schools, and RWAs, sized for commercial tariffs.', hi: 'दुकानों, ऑफ़िसों, स्कूलों और RWA के लिए बड़े सिस्टम, कमर्शियल टैरिफ के अनुसार साइज़ किए गए।' },
  svc6_title: { en: 'Battery Backup Add-ons', hi: 'बैटरी बैकअप ऐड-ऑन' },
  svc6_desc: { en: 'Keep essentials running through outages with a right-sized battery storage upgrade.', hi: 'सही साइज़ की बैटरी स्टोरेज अपग्रेड से बिजली कटौती में भी ज़रूरी चीज़ें चलती रहें।' },

  process_eyebrow: { en: 'How It Works', hi: 'यह कैसे काम करता है' },
  process_title: { en: 'From Site Visit to Subsidy, in Five Steps', hi: 'साइट विज़िट से सब्सिडी तक, पांच स्टेप्स में' },
  step1_title: { en: 'Free Site Visit & Roof Assessment', hi: 'मुफ़्त साइट विज़िट और छत का आकलन' },
  step1_desc: { en: 'Our team studies your roof, shading, and electricity bill to size the right system.', hi: 'हमारी टीम सही सिस्टम साइज़ तय करने के लिए आपकी छत, छाया और बिजली बिल की जांच करती है।' },
  step2_title: { en: 'Subsidy Application Support', hi: 'सब्सिडी आवेदन सहायता' },
  step2_desc: { en: 'We help you register on the PM Surya Ghar portal and prepare the documentation your local DISCOM requires.', hi: 'हम आपको PM सूर्य घर पोर्टल पर रजिस्टर करने और आपके DISCOM के लिए ज़रूरी दस्तावेज़ तैयार करने में मदद करते हैं।' },
  step3_title: { en: 'Design & Installation', hi: 'डिज़ाइन और इंस्टॉलेशन' },
  step3_desc: { en: 'Quality panels and inverter installed by our team, typically within 5–7 days.', hi: 'हमारी टीम द्वारा क्वालिटी पैनल और इन्वर्टर इंस्टॉल, आमतौर पर 5–7 दिनों में।' },
  step4_title: { en: 'Net Meter & Commissioning', hi: 'नेट मीटर और कमीशनिंग' },
  step4_desc: { en: 'Your local DISCOM inspects and commissions your system, and your net meter goes live.', hi: 'आपका स्थानीय DISCOM आपके सिस्टम का निरीक्षण और कमीशन करता है, और आपका नेट मीटर चालू हो जाता है।' },
  step5_title: { en: 'Subsidy Credited to Your Bank', hi: 'सब्सिडी आपके बैंक में जमा' },
  step5_desc: { en: 'Your ₹30,000–₹78,000 subsidy lands directly in your account, usually within 30–45 days.', hi: 'आपकी ₹30,000–₹78,000 तक की सब्सिडी सीधे आपके खाते में, आमतौर पर 30–45 दिनों के भीतर।' },

  stat1_label: { en: 'Homes Powered', hi: 'घरों में सोलर लगाया' },
  stat2_label: { en: 'Capacity Installed', hi: 'क्षमता इंस्टॉल' },
  stat3_label: { en: 'Max Govt. Subsidy', hi: 'अधिकतम सरकारी सब्सिडी' },
  stat4_label: { en: 'Free Power / Month', hi: 'मुफ़्त बिजली / महीना' },

  testi_eyebrow: { en: 'In Their Words', hi: 'उनके शब्दों में' },
  testi_title: { en: 'Sikar Homes, Real Savings', hi: 'सीकर के घर, असली बचत' },
  testi1_quote: { en: '"Our electricity bill went from ₹4,200 to almost nothing. The subsidy paperwork felt scarier than it was — their team handled every form."', hi: '"हमारा बिजली बिल ₹4,200 से लगभग शून्य हो गया। सब्सिडी का कागज़ी काम जितना मुश्किल लग रहा था उतना नहीं था — उनकी टीम ने हर फॉर्म संभाला।"' },
  testi1_cite: { en: 'Ramesh K. <span>· Piprali Road</span>', hi: 'रमेश के. <span>· पिपराली रोड</span>' },
  testi2_quote: { en: '"Installation was done in four days flat, and the net meter was live within three weeks. Didn\'t expect the government process to move that fast."', hi: '"इंस्टॉलेशन सिर्फ़ चार दिन में हो गया, और नेट मीटर तीन हफ़्तों में चालू हो गया। सरकारी प्रक्रिया इतनी तेज़ होगी, यह उम्मीद नहीं थी।"' },
  testi2_cite: { en: 'Anita S. <span>· Jaipur Road</span>', hi: 'अनीता एस. <span>· जयपुर रोड</span>' },
  testi3_quote: { en: '"I compared five vendors. These were the only ones who explained exactly how the ₹78,000 subsidy is calculated instead of just quoting a final price."', hi: '"मैंने पांच वेंडर्स की तुलना की। सिर्फ़ इन्होंने ही बताया कि ₹78,000 की सब्सिडी की गणना कैसे होती है, बाकी सिर्फ़ अंतिम कीमत बताते थे।"' },
  testi3_cite: { en: 'Deepak M. <span>· Fatehpur Road</span>', hi: 'दीपक एम. <span>· फतेहपुर रोड</span>' },
  testi_disclaimer: { en: 'Illustrative reviews — replace with feedback from your own customers once you have installations completed.', hi: 'उदाहरण के तौर पर दिए गए रिव्यू — इंस्टॉलेशन पूरा होने के बाद असली ग्राहकों की प्रतिक्रिया से बदलें।' },

  faq_eyebrow: { en: 'Common Questions', hi: 'आम सवाल' },
  faq_title: { en: 'Before You Decide', hi: 'फैसला लेने से पहले' },
  faq1_q: { en: 'Is the site visit and quote actually free?', hi: 'क्या साइट विज़िट और कोटेशन सच में मुफ़्त है?' },
  faq1_a: { en: 'Yes — the roof assessment, system sizing, and quotation cost nothing and carry no obligation to proceed.', hi: 'हां — छत का आकलन, सिस्टम साइज़िंग और कोटेशन बिल्कुल मुफ़्त है और आगे बढ़ने की कोई बाध्यता नहीं है।' },
  faq2_q: { en: "What if my roof isn't strong enough for panels?", hi: 'अगर मेरी छत पैनल के लिए मज़बूत नहीं है तो?' },
  faq2_a: { en: "Our site visit includes a structural check. Most RCC rooftops in Sikar handle standard mounting without reinforcement; if yours needs extra support, we'll flag it and price it upfront before you commit to anything.", hi: 'हमारी साइट विज़िट में स्ट्रक्चरल जांच शामिल है। सीकर की ज़्यादातर RCC छतें बिना अतिरिक्त मज़बूती के स्टैंडर्ड माउंटिंग संभाल लेती हैं; अगर आपकी छत को अतिरिक्त सहारे की ज़रूरत हो, तो हम पहले ही बता देंगे और कीमत साफ़ बता देंगे।' },
  faq3_q: { en: 'Can I get the subsidy if I live in a rented house?', hi: 'अगर मैं किराए के घर में रहता हूं तो क्या सब्सिडी मिलेगी?' },
  faq3_a: { en: "The PM Surya Ghar subsidy is linked to the electricity connection and typically requires the applicant to be the registered consumer, with the property owner's consent for installation. If you're renting, talk to us and we'll check your specific eligibility.", hi: 'PM सूर्य घर सब्सिडी बिजली कनेक्शन से जुड़ी होती है और आमतौर पर आवेदक को रजिस्टर्ड उपभोक्ता होना चाहिए, साथ ही मकान मालिक की सहमति भी ज़रूरी है। अगर आप किराए पर रहते हैं, तो हमसे बात करें, हम आपकी पात्रता जांच लेंगे।' },
  faq4_q: { en: 'What happens if a panel or inverter fails after installation?', hi: 'इंस्टॉलेशन के बाद अगर पैनल या इन्वर्टर खराब हो जाए तो?' },
  faq4_a: { en: 'Panels typically carry a manufacturer performance warranty of around 25 years, and inverters around 5–10 years depending on brand. We also offer an Annual Maintenance Contract for regular checks and faster response if something needs attention.', hi: 'पैनल पर आमतौर पर लगभग 25 साल की निर्माता परफ़ॉर्मेंस वारंटी होती है, और इन्वर्टर पर ब्रांड के अनुसार 5–10 साल। हम नियमित जांच और तेज़ रिस्पॉन्स के लिए वार्षिक मेंटेनेंस कॉन्ट्रैक्ट भी देते हैं।' },
  faq5_q: { en: 'How long does the whole process take?', hi: 'पूरी प्रक्रिया में कितना समय लगता है?' },
  faq5_a: { en: 'Most homes go from application to power generation in roughly 4–6 weeks — this depends mainly on DISCOM feasibility approval timelines, which are outside our control but which we track closely on your behalf.', hi: 'ज़्यादातर घरों में आवेदन से बिजली उत्पादन शुरू होने तक लगभग 4–6 हफ़्ते लगते हैं — यह मुख्य रूप से DISCOM की फ़िज़िबिलिटी अप्रूवल समयसीमा पर निर्भर करता है, जिसे हम आपकी ओर से बारीकी से ट्रैक करते हैं।' },
  faq6_q: { en: 'Is the government subsidy guaranteed once I apply?', hi: 'क्या आवेदन करने पर सरकारी सब्सिडी की गारंटी है?' },
  faq6_a: { en: "No — it's approved by MNRE/your DISCOM based on eligibility, correct documentation, ALMM-listed panels, and installation by an empanelled vendor. We handle the paperwork carefully to avoid the most common rejection reasons, but final approval is a government decision, not ours.", hi: 'नहीं — यह MNRE/आपके DISCOM द्वारा पात्रता, सही दस्तावेज़, ALMM-सूचीबद्ध पैनल और एम्पैनल्ड वेंडर द्वारा इंस्टॉलेशन के आधार पर मंज़ूर होती है। हम कागज़ी काम बहुत सावधानी से करते हैं ताकि आम कारणों से आवेदन रिजेक्ट न हो, लेकिन अंतिम मंज़ूरी सरकार का फ़ैसला है, हमारा नहीं।' },
  faq7_q: { en: 'Does solar keep working during a power cut?', hi: 'बिजली कटने पर क्या सोलर काम करता रहता है?' },
  faq7_a: { en: 'A standard on-grid system shuts off automatically during outages for safety, same as most rooftop solar in India. If you want power during outages too, ask us about our battery backup add-on.', hi: 'सुरक्षा कारणों से, स्टैंडर्ड ऑन-ग्रिड सिस्टम बिजली कटने पर अपने आप बंद हो जाता है, जैसा भारत में ज़्यादातर रूफटॉप सोलर में होता है। अगर आपको कटौती के दौरान भी बिजली चाहिए, तो हमसे बैटरी बैकअप ऐड-ऑन के बारे में पूछें।' },
  faq8_q: { en: 'Can I finance this instead of paying upfront?', hi: 'क्या मैं इसे एकमुश्त भुगतान की बजाय फाइनेंस करा सकता हूं?' },
  faq8_a: { en: "Several nationalised banks offer collateral-free solar loans for systems under PM Surya Ghar. Rates and limits change, so we'll point you to current options during your site visit rather than quote a number here that may be outdated.", hi: 'कई राष्ट्रीयकृत बैंक PM सूर्य घर के तहत सिस्टम के लिए बिना गारंटी के सोलर लोन देते हैं। दरें और सीमाएं बदलती रहती हैं, इसलिए हम साइट विज़िट के दौरान मौजूदा विकल्प बताएंगे, यहां पुराना आंकड़ा नहीं देंगे।' },

  finalcta_title: { en: 'Your Roof Is Already Collecting Sunlight.<br>Start Collecting the Savings.', hi: 'आपकी छत पहले से ही धूप जमा कर रही है।<br>अब बचत जमा करना शुरू करें।' },
  finalcta_lead: { en: "Book a free, no-obligation site visit — we'll tell you your exact subsidy amount and payback period before you decide anything.", hi: 'मुफ़्त, बिना किसी बाध्यता वाली साइट विज़िट बुक करें — फ़ैसला लेने से पहले हम आपको सही सब्सिडी राशि और पेबैक समय बता देंगे।' },
  finalcta_btn1: { en: 'Book Free Site Visit', hi: 'मुफ़्त साइट विज़िट बुक करें' },

  contact_eyebrow: { en: 'Get In Touch', hi: 'संपर्क करें' },
  contact_title: { en: 'Get Your Free Subsidy & Site Estimate', hi: 'अपनी मुफ़्त सब्सिडी और साइट अनुमान पाएं' },
  contact_lead: { en: 'Fill this in and it opens a pre-filled WhatsApp message straight to us — or call/visit directly.', hi: 'यह भरें और यह सीधे हमें एक पहले से भरा हुआ WhatsApp मैसेज खोल देगा — या सीधे कॉल/विज़िट करें।' },
  form_name_label: { en: 'Full Name', hi: 'पूरा नाम' },
  form_name_placeholder: { en: 'Your name', hi: 'आपका नाम' },
  form_phone_label: { en: 'Phone Number', hi: 'फ़ोन नंबर' },
  form_phone_placeholder: { en: '10-digit mobile number', hi: '10 अंकों का मोबाइल नंबर' },
  form_locality_label: { en: 'Locality in Sikar', hi: 'सीकर में इलाका' },
  form_locality_placeholder: { en: 'e.g. Piprali Road', hi: 'जैसे पिपराली रोड' },
  form_bill_label: { en: 'Approx. Monthly Electricity Bill', hi: 'लगभग मासिक बिजली बिल' },
  bill_opt1: { en: 'Under ₹2,000', hi: '₹2,000 से कम' },
  bill_opt2: { en: '₹2,000 – ₹4,000', hi: '₹2,000 – ₹4,000' },
  bill_opt3: { en: '₹4,000 – ₹8,000', hi: '₹4,000 – ₹8,000' },
  bill_opt4: { en: 'Above ₹8,000', hi: '₹8,000 से ज़्यादा' },
  form_message_label: { en: 'Message (optional)', hi: 'संदेश (वैकल्पिक)' },
  form_message_placeholder: { en: 'Anything else we should know?', hi: 'कुछ और बताना चाहेंगे?' },
  form_submit: { en: 'Send via WhatsApp', hi: 'WhatsApp से भेजें' },
  contact_card1_title: { en: 'Visit Our Shop', hi: 'हमारी दुकान पर आएं' },
  contact_card1_addr: { en: 'Jaipur Road, near Shyam Residency<br>Sikar, Rajasthan', hi: 'जयपुर रोड, श्याम रेजिडेंसी के पास<br>सीकर, राजस्थान' },
  contact_card2_title: { en: 'Call or WhatsApp', hi: 'कॉल या WhatsApp करें' },
  whatsapp_chat: { en: 'WhatsApp Chat →', hi: 'WhatsApp चैट →' },
  contact_card3_title: { en: 'Email', hi: 'ईमेल' },
  contact_card4_title: { en: 'Hours', hi: 'समय' },
  contact_card4_hours: { en: 'Mon – Sat, 10:00 AM – 7:00 PM', hi: 'सोम – शनि, सुबह 10:00 – शाम 7:00' },
  map_placeholder: { en: 'Google Maps embed goes here', hi: 'यहां गूगल मैप्स एम्बेड होगा' },

  footer_tagline: { en: 'Shree Vinayak Solar Agency (SVSOLAR) — rooftop solar installer serving Sikar & Rajasthan.', hi: 'श्री विनायक सोलर एजेंसी (SVSOLAR) — सीकर और राजस्थान में रूफटॉप सोलर इंस्टॉलर।' },
  footer_privacy: { en: 'Privacy Policy', hi: 'गोपनीयता नीति' },
  footer_terms: { en: 'Terms & Disclaimer', hi: 'नियम व अस्वीकरण' },
  footer_rights: { en: 'All rights reserved.', hi: 'सर्वाधिकार सुरक्षित।' },
  footer_scheme_note: { en: 'Government scheme details sourced from pmsuryaghar.gov.in — please verify current rates before purchase decisions.', hi: 'सरकारी योजना की जानकारी pmsuryaghar.gov.in से ली गई है — खरीदारी से पहले मौजूदा दरें ज़रूर जांच लें।' }
};

window.currentLang = localStorage.getItem('svsolar_lang') || 'en';

function applyLanguage(lang) {
  window.currentLang = lang;
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const entry = translations[el.getAttribute('data-i18n')];
    if (!entry) return;
    if (el.hasAttribute('data-i18n-html')) el.innerHTML = entry[lang];
    else el.textContent = entry[lang];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const entry = translations[el.getAttribute('data-i18n-placeholder')];
    if (entry) el.setAttribute('placeholder', entry[lang]);
  });

  const toggle = document.getElementById('langToggle');
  if (toggle) {
    toggle.classList.toggle('is-hi', lang === 'hi');
    toggle.querySelectorAll('.lang-toggle__opt').forEach((opt) => {
      opt.classList.toggle('is-active', opt.dataset.lang === lang);
    });
  }

  // keep any open FAQ panel sized correctly after text reflows
  document.querySelectorAll('.faq-item.is-open .faq-item__a').forEach((panel) => {
    panel.style.maxHeight = panel.scrollHeight + 'px';
  });

  // refresh the calculator's "By year N" label in the new language
  if (typeof window.refreshCalcLang === 'function') window.refreshCalcLang();

  localStorage.setItem('svsolar_lang', lang);
}

document.getElementById('langToggle').addEventListener('click', () => {
  applyLanguage(window.currentLang === 'en' ? 'hi' : 'en');
});

applyLanguage(window.currentLang);

/* ---------- Sticky mobile CTA bar ---------- */
const stickyCta = document.getElementById('stickyCta');
if (stickyCta) {
  const heroEl = document.querySelector('.hero');
  const io2 = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        stickyCta.classList.toggle('is-visible', !entry.isIntersecting);
      });
    },
    { threshold: 0 }
  );
  if (heroEl) io2.observe(heroEl);
}
