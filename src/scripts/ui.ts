/**
 * Interface behaviour that does not depend on animation: navigation,
 * service tabs, the service finder, accordions, carousel and copy buttons.
 * Everything here works with reduced motion and keyboard input.
 */
import { gsap } from 'gsap';

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDesktopPointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------------- Header, progress, menu ---------------- */

function initHeader() {
  const header = $('[data-header]');
  const bar = $('[data-scroll-progress]');
  if (!header) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 8);
    if (bar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    }
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  window.addEventListener('resize', update, { passive: true });
  update();

  // Highlight the nav link of the section in view
  const links = $$<HTMLAnchorElement>('[data-nav-link]');
  const sections = links
    .map((a) => document.getElementById(a.hash.slice(1)))
    .filter((s): s is HTMLElement => Boolean(s));
  if ('IntersectionObserver' in window && sections.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((a) => {
            const active = a.hash === `#${entry.target.id}`;
            a.classList.toggle('is-active', active);
            if (active) a.setAttribute('aria-current', 'true');
            else a.removeAttribute('aria-current');
          });
        });
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    sections.forEach((s) => io.observe(s));
  }
}

function initMenu() {
  const toggle = $<HTMLButtonElement>('[data-menu-toggle]');
  const menu = $('[data-menu]');
  const label = $('[data-menu-label]');
  if (!toggle || !menu) return;

  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    if (label) label.textContent = open ? 'Փակել ընտրացանկը' : 'Բացել ընտրացանկը';
    menu.hidden = !open;
    menu.classList.toggle('is-open', open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) $<HTMLAnchorElement>('a', menu)?.focus({ preventScroll: true });
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  $$('[data-menu-link]', menu).forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 1041px)').addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
  });
}

function initMobileBar() {
  const bar = $('[data-mobile-bar]');
  if (!bar || !('IntersectionObserver' in window)) return;
  const watched = [$('[data-hero]'), $('#contact'), $('.footer')].filter(Boolean) as HTMLElement[];
  const visible = new Set<Element>();
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
      bar.classList.toggle('is-hidden', visible.size > 0);
    },
    { threshold: 0.12 },
  );
  watched.forEach((el) => io.observe(el));
}

/* ---------------- Services: tabs on desktop, accordion on mobile ---------------- */

function initServices() {
  const root = $('[data-services]');
  if (!root) return;
  const tabs = $$<HTMLButtonElement>('[data-svc-tab]', root);
  const panels = $$('[data-svc-panel]', root);
  const desktop = window.matchMedia('(min-width: 961px)');
  root.classList.add('svc--tabs');

  const animateIn = (panel: HTMLElement) => {
    if (prefersReducedMotion()) return;
    const inner = $('.svc__panel-inner', panel);
    if (!inner) return;
    gsap.fromTo(
      inner.children,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.05, overwrite: true, clearProps: 'opacity,transform' },
    );
  };

  const open = (key: string | null) => {
    tabs.forEach((t) => t.setAttribute('aria-expanded', String(t.dataset.svcTab === key)));
    panels.forEach((p) => {
      const show = p.dataset.svcPanel === key;
      const wasHidden = p.hidden;
      p.hidden = !show;
      if (show && wasHidden) animateIn(p);
    });
  };

  tabs.forEach((tab) =>
    tab.addEventListener('click', () => {
      const key = tab.dataset.svcTab ?? null;
      const isOpen = tab.getAttribute('aria-expanded') === 'true';
      if (desktop.matches) {
        if (!isOpen) open(key);
      } else {
        open(isOpen ? null : key);
        if (!isOpen) requestAnimationFrame(() => tab.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' }));
      }
    }),
  );

  // Arrow keys move between service buttons
  root.addEventListener('keydown', (e) => {
    const idx = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (idx < 0) return;
    let next = -1;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
    if (next >= 0) {
      e.preventDefault();
      tabs[next].focus();
      if (desktop.matches) open(tabs[next].dataset.svcTab ?? null);
    }
  });

  desktop.addEventListener('change', (e) => {
    if (e.matches && !tabs.some((t) => t.getAttribute('aria-expanded') === 'true')) open(tabs[0].dataset.svcTab ?? null);
  });

  open(tabs[0]?.dataset.svcTab ?? null);
}

/* ---------------- Service finder ---------------- */

function initFinder() {
  const group = $('[data-finder]');
  const result = $('[data-finder-result]');
  if (!group || !result) return;
  const options = $$<HTMLButtonElement>('[data-finder-option]', group);
  const cards = $$('[data-finder-card]', result);

  const select = (opt: HTMLButtonElement, focus = false) => {
    const id = opt.dataset.finderOption;
    options.forEach((o) => {
      const on = o === opt;
      o.setAttribute('aria-checked', String(on));
      o.tabIndex = on ? 0 : -1;
    });
    if (focus) opt.focus();
    cards.forEach((card) => {
      const show = card.dataset.finderCard === id;
      if (show && card.hidden) {
        card.hidden = false;
        if (!prefersReducedMotion()) {
          gsap.fromTo(
            card,
            { opacity: 0, y: 16, clipPath: 'inset(0 0 12% 0 round 6px 40px 6px 40px)' },
            { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0 round 6px 40px 6px 40px)', duration: 0.6, ease: 'power3.out', clearProps: 'all' },
          );
        }
      } else if (!show) {
        card.hidden = true;
      }
    });
  };

  options.forEach((o) => o.addEventListener('click', () => select(o)));
  group.addEventListener('keydown', (e) => {
    const idx = options.indexOf(document.activeElement as HTMLButtonElement);
    if (idx < 0) return;
    let next = -1;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (idx + 1) % options.length;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (idx - 1 + options.length) % options.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = options.length - 1;
    if (next >= 0) {
      e.preventDefault();
      select(options[next], true);
    }
  });
}

/* ---------------- Topic shortcuts → inquiry form ---------------- */

function initTopicLinks() {
  const selectEl = $<HTMLSelectElement>('[data-topic-select]');
  if (!selectEl) return;
  document.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest<HTMLElement>('[data-topic]');
    if (!link) return;
    const topic = link.dataset.topic;
    if (topic && Array.from(selectEl.options).some((o) => o.value === topic)) {
      selectEl.value = topic;
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (isDesktopPointer()) {
      window.setTimeout(() => document.getElementById('f-name')?.focus({ preventScroll: true }), prefersReducedMotion() ? 0 : 700);
    }
  });
}

/* ---------------- Trust questions ---------------- */

function initQuestions() {
  $$<HTMLButtonElement>('[data-question-toggle]').forEach((btn) => {
    const answer = document.getElementById(btn.getAttribute('aria-controls') ?? '');
    if (!answer) return;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      answer.classList.toggle('is-open', open);
    });
  });
}

/* ---------------- FAQ: animated native <details> ---------------- */

function initFaq() {
  const list = $('[data-faq]');
  if (!list) return;
  const items = $$<HTMLDetailsElement>('details', list);
  // Manage exclusivity in script so closing can animate.
  items.forEach((d) => d.removeAttribute('name'));

  const collapse = (d: HTMLDetailsElement) => {
    const content = $('.faq__a', d);
    if (!content || prefersReducedMotion()) {
      d.open = false;
      return;
    }
    gsap.fromTo(
      content,
      { height: content.offsetHeight },
      {
        height: 0,
        opacity: 0,
        duration: 0.38,
        ease: 'power2.inOut',
        onComplete: () => {
          d.open = false;
          gsap.set(content, { clearProps: 'height,opacity' });
        },
      },
    );
  };

  const expand = (d: HTMLDetailsElement) => {
    d.open = true;
    const content = $('.faq__a', d);
    if (!content || prefersReducedMotion()) return;
    gsap.fromTo(
      content,
      { height: 0, opacity: 0 },
      { height: content.scrollHeight, opacity: 1, duration: 0.5, ease: 'power3.out', clearProps: 'height,opacity' },
    );
  };

  items.forEach((d) => {
    const summary = $('summary', d);
    summary?.addEventListener('click', (e) => {
      e.preventDefault();
      if (d.open) {
        collapse(d);
      } else {
        items.filter((o) => o !== d && o.open).forEach(collapse);
        expand(d);
      }
    });
  });
}

/* ---------------- Insights carousel ---------------- */

function initCarousel() {
  const track = $('[data-carousel]');
  if (!track) return;
  const prev = $<HTMLButtonElement>('[data-carousel-prev]');
  const next = $<HTMLButtonElement>('[data-carousel-next]');

  const step = () => {
    const card = track.querySelector('li');
    const gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
    return card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
  };
  const updateButtons = () => {
    const max = track.scrollWidth - track.clientWidth - 2;
    if (prev) prev.disabled = track.scrollLeft <= 2;
    if (next) next.disabled = track.scrollLeft >= max;
  };
  const behavior = (): ScrollBehavior => (prefersReducedMotion() ? 'auto' : 'smooth');
  prev?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: behavior() }));
  next?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: behavior() }));
  track.addEventListener('scroll', () => requestAnimationFrame(updateButtons), { passive: true });
  window.addEventListener('resize', updateButtons, { passive: true });
  updateButtons();

  // Drag to scroll with a mouse (touch already scrolls natively)
  let startX = 0;
  let startLeft = 0;
  let dragging = false;
  let moved = false;
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    startLeft = track.scrollLeft;
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 5 && !moved) {
      moved = true;
      track.classList.add('is-dragging');
    }
    if (moved) track.scrollLeft = startLeft - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    if (moved) {
      // Let snapping settle after the drag ends
      requestAnimationFrame(() => track.classList.remove('is-dragging'));
    }
  });
  track.addEventListener(
    'click',
    (e) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    },
    true,
  );
}

/* ---------------- Copy phone numbers ---------------- */

function initCopy() {
  $$<HTMLButtonElement>('[data-copy]').forEach((btn) => {
    const label = $('[data-copy-label]', btn);
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy ?? '';
      let ok = false;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch {
        const number = btn.closest('.contact__phone')?.querySelector('.contact__number');
        if (number) {
          const range = document.createRange();
          range.selectNodeContents(number);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }
      if (label) {
        label.textContent = ok ? 'Պատճենված է' : 'Ընտրված է';
        btn.classList.add('is-done');
        window.setTimeout(() => {
          label.textContent = 'Պատճենել';
          btn.classList.remove('is-done');
        }, 2200);
      }
    });
  });
}

/* ---------------- Hero: today's position on the year dial ---------------- */

function initHeroDial() {
  const visual = $('[data-hero-visual]');
  if (!visual) return;
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Yerevan', year: 'numeric', month: 'numeric', day: 'numeric' })
      .formatToParts(new Date())
      .reduce<Record<string, number>>((acc, p) => (p.type === 'literal' ? acc : { ...acc, [p.type]: Number(p.value) }), {});
    const days = new Date(parts.year, parts.month, 0).getDate();
    const p = (parts.month - 1 + (parts.day - 1) / days) / 12;
    visual.style.setProperty('--p', p.toFixed(4));
  } catch {
    /* keep the build-time value */
  }

  const replay = $('[data-hv-replay]');
  replay?.addEventListener('click', () => {
    visual.classList.remove('is-playing');
    void visual.getBoundingClientRect();
    visual.classList.add('is-playing');
  });
}

export function initUI() {
  initHeader();
  initMenu();
  initMobileBar();
  initServices();
  initFinder();
  initTopicLinks();
  initQuestions();
  initFaq();
  initCarousel();
  initCopy();
  initHeroDial();
}
