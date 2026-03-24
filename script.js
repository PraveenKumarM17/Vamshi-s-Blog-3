/* ============================================================
   THE DEV MIND — script.js
   Features:
     · Particle canvas background
     · Reading progress bar
     · Navbar scroll behavior
     · Scroll-reveal animations
     · Active TOC link tracking
     · Finale word animation trigger
   ============================================================ */

'use strict';

// ─── Utility ────────────────────────────────────────────────
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const all = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ─── 1. Particle Canvas ──────────────────────────────────────
(function initParticles() {
  const canvas = qs('#particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles;
  const COUNT = 90;
  const COLORS = ['#6366f1', '#8b5cf6', '#22d3ee', '#a78bfa', '#818cf8'];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function createParticle() {
    return {
      x:    rand(0, W),
      y:    rand(0, H),
      r:    rand(0.5, 2.2),
      dx:   rand(-0.25, 0.25),
      dy:   rand(-0.35, -0.08),
      alpha: rand(0.1, 0.65),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      pulse: rand(0, Math.PI * 2),
    };
  }

  function initParticleSet() {
    particles = Array.from({ length: COUNT }, createParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const t = performance.now() * 0.001;

    particles.forEach(p => {
      p.pulse += 0.015;
      const a = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle   = p.color;
      ctx.shadowBlur  = 8;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      p.x += p.dx;
      p.y += p.dy;

      // Wrap around
      if (p.y < -10) { p.y = H + 10; p.x = rand(0, W); }
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
    });

    // Draw subtle connecting lines between close particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 110) {
          ctx.save();
          ctx.globalAlpha = (1 - dist / 110) * 0.12;
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth   = 0.6;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  resize();
  initParticleSet();
  draw();
  window.addEventListener('resize', () => { resize(); });
})();


// ─── 2. Reading Progress Bar ─────────────────────────────────
(function initProgressBar() {
  const bar = qs('#progress-bar');
  if (!bar) return;

  function update() {
    const scrollTop    = window.scrollY;
    const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
    const pct          = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width    = pct.toFixed(2) + '%';
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();


// ─── 3. Navbar Scroll Behavior ───────────────────────────────
(function initNavbar() {
  const nav = qs('#navbar');
  if (!nav) return;

  let ticking = false;
  function update() {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
})();


// ─── 4. Scroll-Reveal (IntersectionObserver) ─────────────────
(function initReveal() {
  const els = all('.reveal-up');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Keep observing for re-enter effect? (one-shot is cleaner)
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  });

  els.forEach(el => observer.observe(el));
})();


// ─── 5. Active TOC Link Tracking ────────────────────────────
(function initTOC() {
  const sections   = all('.article-section, [id^="section-"]');
  const tocLinks   = all('.toc-link');
  if (!tocLinks.length) return;

  const navH = 90;

  function getActiveSection() {
    const scrollY = window.scrollY + navH + 80;
    let active = null;
    sections.forEach(sec => {
      if (sec.offsetTop <= scrollY) active = sec.id;
    });
    return active;
  }

  function update() {
    const activeId = getActiveSection();
    tocLinks.forEach(link => {
      const matches = link.getAttribute('href') === '#' + activeId ||
                      link.dataset.section === activeId;
      link.classList.toggle('active', matches);
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();


// ─── 6. Finale Word Glitch Effect ────────────────────────────
(function initFinaleEffect() {
  const el = qs('#finale-word');
  if (!el) return;

  const chars   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!?#@*';
  const original = el.textContent.trim();
  let   triggered = false;
  let   interval;

  function scramble(step, maxSteps) {
    if (step >= maxSteps) {
      el.textContent = original;
      clearInterval(interval);
      return;
    }
    el.textContent = original.split('').map((ch, i) => {
      if (ch === ' ') return ' ';
      if (i < (step / maxSteps) * original.length) return ch;
      return chars[Math.floor(Math.random() * chars.length)];
    }).join('');
  }

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !triggered) {
      triggered = true;
      let step = 0;
      const maxSteps = 30;
      interval = setInterval(() => {
        scramble(step, maxSteps);
        step++;
      }, 48);
    }
  }, { threshold: 0.5 });

  observer.observe(el);
})();


// ─── 7. Cursor glow trace (subtle) ──────────────────────────
(function initCursorGlow() {
  // Only on desktop
  if (window.innerWidth < 1024) return;

  const glow = document.createElement('div');
  Object.assign(glow.style, {
    position:      'fixed',
    top:           '0',
    left:          '0',
    width:         '320px',
    height:        '320px',
    background:    'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 65%)',
    pointerEvents: 'none',
    zIndex:        '1',
    transform:     'translate(-50%, -50%)',
    transition:    'opacity 0.3s',
    borderRadius:  '50%',
  });
  document.body.appendChild(glow);

  let mx = -9999, my = -9999;
  let cx = -9999, cy = -9999;
  let running = false;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    if (!running) {
      running = true;
      requestAnimationFrame(moveGlow);
    }
  });

  function moveGlow() {
    cx += (mx - cx) * 0.08;
    cy += (my - cy) * 0.08;
    glow.style.left = cx + 'px';
    glow.style.top  = cy + 'px';
    running = false;
  }
})();


// ─── 8. Smooth Anchor Scrolling ──────────────────────────────
document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const targetId = link.getAttribute('href').slice(1);
  const target   = document.getElementById(targetId);
  if (!target) return;

  e.preventDefault();
  const top = target.getBoundingClientRect().top + window.scrollY - 90;
  window.scrollTo({ top, behavior: 'smooth' });
});


// ─── 9. Hero Parallax ────────────────────────────────────────
(function initParallax() {
  const img     = qs('#hero-img');
  const content = qs('#hero-content');
  if (!img) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        img.style.transform     = `scale(1) translateY(${y * 0.25}px)`;
        if (content) {
          content.style.transform = `translateY(${y * 0.12}px)`;
          content.style.opacity   = Math.max(0, 1 - y / 550);
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();
