/**
 * Maberal – main.js
 * JavaScript vanilla: sin frameworks ni librerías externas.
 *
 * Módulos:
 *  1. Navbar scroll + menú hamburguesa
 *  2. Scroll suave
 *  3. Animaciones Intersection Observer (.reveal)
 *  4. Carrusel de testimonios
 *  5. Filtro de proyectos
 *  6. Validación y envío del formulario
 *  7. Contador de estadísticas animado
 *  8. Link activo en navbar según scroll
 */

'use strict';

/* ============================================================
   1. NAVBAR – scroll + hamburguesa
============================================================ */
(function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navMenu   = document.getElementById('navMenu');

  if (!navbar || !hamburger || !navMenu) return;

  /* Cambiar apariencia al hacer scroll */
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); /* aplicar estado inicial */

  /* Toggle menú móvil */
  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(isOpen));
    navMenu.classList.toggle('open', isOpen);
    /* Bloquear scroll del body mientras el menú está abierto */
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  /* Cerrar menú al hacer clic en un enlace */
  navMenu.querySelectorAll('.navbar__link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  /* Cerrar menú con tecla Escape */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navMenu.classList.contains('open')) {
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('open');
      document.body.style.overflow = '';
      hamburger.focus();
    }
  });
})();

/* ============================================================
   2. SCROLL SUAVE
   (complementa scroll-behavior: smooth del CSS para mayor
   compatibilidad con Safari y anclajes desde el navbar fijo)
============================================================ */
(function initSmoothScroll() {
  const navbarHeight = () =>
    parseInt(getComputedStyle(document.documentElement).getPropertyValue('--navbar-height')) || 72;

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - navbarHeight();
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

/* ============================================================
   3. ANIMACIONES – Intersection Observer
============================================================ */
(function initRevealAnimations() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  /* Respetar preferencia de movimiento reducido */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); /* Animar solo una vez */
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(el => observer.observe(el));
})();

/* ============================================================
   4. CARRUSEL DE TESTIMONIOS
============================================================ */
(function initTestimonialSlider() {
  const track    = document.getElementById('testimonialTrack');
  const slider   = document.getElementById('testimonialSlider');
  const prevBtn  = document.getElementById('prevBtn');
  const nextBtn  = document.getElementById('nextBtn');
  const dotsContainer = document.getElementById('testimonialDots');

  if (!track || !prevBtn || !nextBtn) return;

  const cards = track.querySelectorAll('.testimonial-card');
  const total = cards.length;
  let current = 0;
  let autoplayTimer = null;

  /* Actualizar posición y dots */
  const goTo = (index) => {
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;

    /* Actualizar dots */
    dotsContainer.querySelectorAll('.dot').forEach((dot, i) => {
      dot.classList.toggle('dot--active', i === current);
      dot.setAttribute('aria-selected', String(i === current));
    });
  };

  /* Controles manual */
  prevBtn.addEventListener('click', () => { goTo(current - 1); resetAutoplay(); });
  nextBtn.addEventListener('click', () => { goTo(current + 1); resetAutoplay(); });

  /* Dots */
  dotsContainer.querySelectorAll('.dot').forEach(dot => {
    dot.addEventListener('click', () => {
      goTo(parseInt(dot.dataset.index, 10));
      resetAutoplay();
    });
  });

  /* Soporte de teclado para los dots */
  dotsContainer.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { goTo(current + 1); resetAutoplay(); }
    if (e.key === 'ArrowLeft')  { goTo(current - 1); resetAutoplay(); }
  });

  /* Autoplay cada 5 segundos */
  const startAutoplay = () => {
    autoplayTimer = setInterval(() => goTo(current + 1), 5000);
  };

  const resetAutoplay = () => {
    clearInterval(autoplayTimer);
    startAutoplay();
  };

  /* Pausar en hover */
  slider.addEventListener('mouseenter', () => clearInterval(autoplayTimer));
  slider.addEventListener('mouseleave', startAutoplay);

  /* Swipe táctil */
  let touchStartX = 0;
  slider.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  slider.addEventListener('touchend', e => {
    const delta = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) {
      delta > 0 ? goTo(current + 1) : goTo(current - 1);
      resetAutoplay();
    }
  }, { passive: true });

  startAutoplay();
  goTo(0); /* Estado inicial */
})();

/* ============================================================
   5. FILTRO DE PROYECTOS
============================================================ */
(function initProjectFilter() {
  const filterBtns  = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  if (!filterBtns.length || !projectCards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      /* Actualizar botón activo */
      filterBtns.forEach(b => b.classList.remove('filter-btn--active'));
      btn.classList.add('filter-btn--active');

      const filter = btn.dataset.filter;

      projectCards.forEach(card => {
        const category = card.dataset.category;
        const show = filter === 'all' || category === filter;

        if (show) {
          card.classList.remove('hidden');
          /* Pequeña demora para que el fade entre bien */
          requestAnimationFrame(() => { card.style.opacity = '1'; card.style.transform = ''; });
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          /* Esperar la transición antes de ocultar */
          setTimeout(() => { card.classList.add('hidden'); }, 300);
        }
      });
    });
  });
})();

/* ============================================================
   6. FORMULARIO DE CONTACTO – validación y envío simulado
============================================================ */
(function initContactForm() {
  const form       = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn      = document.getElementById('submitBtn');
  const submitText     = submitBtn.querySelector('.form-submit__text');
  const submitLoading  = submitBtn.querySelector('.form-submit__loading');
  const formSuccess    = document.getElementById('formSuccess');

  /* Reglas de validación por campo */
  const rules = {
    name:    { required: true,  minLength: 2, label: 'Nombre' },
    email:   { required: true,  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, label: 'Correo electrónico' },
    phone:   { required: false, pattern: /^(\+34|0034)?[\s\-]?[6789]\d{2}[\s\-]?\d{3}[\s\-]?\d{3}$/, label: 'Teléfono' },
    subject: { required: true,  minLength: 3, label: 'Asunto' },
    message: { required: true,  minLength: 10, label: 'Mensaje' },
  };

  /* Valida un campo individual y muestra/oculta error */
  const validateField = (fieldId) => {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(fieldId + 'Error');
    const rule = rules[fieldId];

    if (!field || !rule) return true;

    const value = field.value.trim();
    let error = '';

    if (rule.required && !value) {
      error = `${rule.label} es obligatorio.`;
    } else if (value && rule.minLength && value.length < rule.minLength) {
      error = `${rule.label} debe tener al menos ${rule.minLength} caracteres.`;
    } else if (value && rule.pattern && !rule.pattern.test(value)) {
      error = `${rule.label} no es válido.`;
    }

    if (errorEl) errorEl.textContent = error;
    field.classList.toggle('error', !!error);
    field.classList.toggle('success', !error && value.length > 0);

    return !error;
  };

  /* Validación en tiempo real (al salir del campo) */
  Object.keys(rules).forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.addEventListener('blur',  () => validateField(fieldId));
    field.addEventListener('input', () => {
      /* Limpiar error mientras el usuario escribe */
      if (field.classList.contains('error')) validateField(fieldId);
    });
  });

  /* Submit */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    /* Validar todos los campos */
    const isValid = Object.keys(rules).map(validateField).every(Boolean);
    if (!isValid) {
      /* Poner foco en el primer campo con error */
      const firstError = form.querySelector('.error');
      if (firstError) firstError.focus();
      return;
    }

    /* Mostrar estado de carga */
    submitText.hidden    = true;
    submitLoading.hidden = false;
    submitBtn.disabled   = true;

    /* Simular llamada al servidor (1.5 s) */
    /* TODO: Reemplazar con llamada real al backend / servicio de email */
    await new Promise(resolve => setTimeout(resolve, 1500));

    /* Mostrar éxito */
    submitText.hidden    = false;
    submitLoading.hidden = true;
    submitBtn.disabled   = false;
    formSuccess.hidden   = false;
    form.reset();

    /* Limpiar clases de validación */
    form.querySelectorAll('.success, .error').forEach(el => {
      el.classList.remove('success', 'error');
    });

    /* Ocultar mensaje de éxito después de 6 s */
    setTimeout(() => { formSuccess.hidden = true; }, 6000);
  });
})();

/* ============================================================
   7. CONTADOR DE ESTADÍSTICAS ANIMADO
============================================================ */
(function initCounters() {
  const counters = document.querySelectorAll('.stat-item__number');
  if (!counters.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    counters.forEach(el => { el.textContent = el.dataset.target; });
    return;
  }

  const easeOut = (t) => 1 - Math.pow(1 - t, 3); /* curva ease-out cúbica */

  const animateCounter = (el) => {
    const target   = parseInt(el.dataset.target, 10);
    const duration = 1800; /* ms */
    const start    = performance.now();

    const step = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value    = Math.round(easeOut(progress) * target);
      el.textContent = value.toLocaleString('es-MX');
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  /* Disparar cuando la sección de stats entre en el viewport */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach(el => observer.observe(el));
})();

/* ============================================================
   8. LINK ACTIVO EN NAVBAR SEGÚN SCROLL
============================================================ */
(function initActiveNavLink() {
  const sections = document.querySelectorAll('main section[id]');
  const links    = document.querySelectorAll('.navbar__link');
  if (!sections.length || !links.length) return;

  const setActive = () => {
    let currentSection = '';
    sections.forEach(section => {
      const top = section.getBoundingClientRect().top;
      if (top <= 120) currentSection = section.id;
    });

    links.forEach(link => {
      const href = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active', href === currentSection);
    });
  };

  window.addEventListener('scroll', setActive, { passive: true });
  setActive();
})();
