/**
 * Scroll and pointer motion (GSAP + ScrollTrigger + SplitText).
 * Runs only when the visitor has not asked for reduced motion. All content
 * is readable without it: elements are hidden only right before they animate
 * in, and only when they start below the first screen.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

const belowFold = (el: Element) => el.getBoundingClientRect().top > window.innerHeight * 0.92;

/* ---------- Hero: scroll hand-off and pointer depth ---------- */

function heroScroll() {
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 },
  });
  tl.to('[data-hero-copy]', { y: -60, opacity: 0.35 }, 0)
    .to('[data-hero-bg]', { y: 120 }, 0)
    .to('[data-hero-visual-wrap]', { y: 70, scale: 0.94 }, 0)
    .to('[data-hv-layer="back"]', { rotation: -10, svgOrigin: '300 310' }, 0)
    .to('[data-hv-layer="mid"]', { y: -26 }, 0)
    .to('[data-hv-layer="front"]', { y: -64 }, 0);
}

function heroPointer() {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const layers = $$<SVGGElement>('[data-hero-visual] [data-depth]');
  if (!hero || !layers.length) return () => {};
  const movers = layers.map((el) => {
    const depth = Number(el.dataset.depth ?? 0.5);
    return {
      depth,
      x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' }),
      y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3.out' }),
    };
  });
  const onMove = (e: PointerEvent) => {
    const r = hero.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    movers.forEach((m) => {
      m.x(nx * 26 * m.depth);
      m.y(ny * 20 * m.depth);
    });
  };
  const onLeave = () => movers.forEach((m) => (m.x(0), m.y(0)));
  hero.addEventListener('pointermove', onMove);
  hero.addEventListener('pointerleave', onLeave);
  return () => {
    hero.removeEventListener('pointermove', onMove);
    hero.removeEventListener('pointerleave', onLeave);
  };
}

/* ---------- Headings: lines rise out of a mask ---------- */

function splitHeadings() {
  const splits: SplitText[] = [];
  $$('[data-split]').forEach((el) => {
    if (!belowFold(el)) return;
    const split = SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'split-line',
      autoSplit: true,
      aria: 'auto',
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 105,
          duration: 1.05,
          ease: 'expo.out',
          stagger: 0.09,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }),
    });
    splits.push(split);
  });
  return () => splits.forEach((s) => s.revert());
}

/* ---------- Generic reveals ---------- */

function reveals() {
  const items = $$('[data-reveal]').filter(belowFold);
  if (!items.length) return () => {};
  items.forEach((el) => el.classList.add('is-pending'));
  gsap.set(items, { opacity: 0, y: 26 });
  const reveal = (batch: Element[]) => {
    batch.forEach((el) => el.classList.remove('is-pending'));
    gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07, overwrite: true, clearProps: 'transform' });
  };
  ScrollTrigger.batch(items, { start: 'top 90%', once: true, onEnter: reveal });

  // A keyboard user tabbing into a pending element sees it immediately.
  const onFocus = (e: FocusEvent) => {
    const el = (e.target as Element).closest?.('.is-pending');
    if (el) reveal([el]);
  };
  document.addEventListener('focusin', onFocus);
  return () => {
    document.removeEventListener('focusin', onFocus);
    items.forEach((el) => el.classList.remove('is-pending'));
  };
}

/* ---------- "Why accounting matters" ledger ---------- */

function ledger() {
  const list = document.querySelector('[data-ledger]');
  if (!list) return () => {};
  list.classList.add('ledger--live');
  const rows = $$('[data-ledger-row]', list);
  rows.forEach((row) =>
    ScrollTrigger.create({
      trigger: row,
      start: 'top 72%',
      onEnter: () => row.classList.add('is-active'),
      onLeaveBack: () => row.classList.remove('is-active'),
    }),
  );
  return () => {
    list.classList.remove('ledger--live');
    rows.forEach((r) => r.classList.remove('is-active'));
  };
}

/* ---------- Decorative depth ---------- */

function parallax() {
  $$('[data-parallax]').forEach((el) => {
    const speed = Number(el.dataset.parallax ?? 0.1);
    gsap.fromTo(
      el,
      { yPercent: -speed * 100 },
      {
        yPercent: speed * 100,
        ease: 'none',
        scrollTrigger: { trigger: el.closest('section') ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });

  $$('[data-parallax-frame]').forEach((frame) => {
    const img = frame.querySelector('img');
    if (!img) return;
    gsap.fromTo(
      img,
      { yPercent: -5 },
      { yPercent: 5, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
  });

  const final = document.querySelector('[data-final]');
  if (final) {
    // The two blocks of the logo mark part like doors ("our doors are open").
    gsap
      .timeline({ scrollTrigger: { trigger: final, start: 'top 85%', end: 'center center', scrub: 0.8 } })
      .fromTo('[data-final-leaf="top"]', { x: 0, y: 0 }, { x: -18, y: -12, ease: 'none' }, 0)
      .fromTo('[data-final-leaf="bottom"]', { x: 0, y: 0 }, { x: 18, y: 12, ease: 'none' }, 0)
      .fromTo('.final__mark', { scale: 0.86 }, { scale: 1.08, ease: 'none' }, 0);
  }

  // The dark process section opens up from a framed card to full width.
  const process = document.querySelector<HTMLElement>('[data-process]');
  if (process) {
    gsap.fromTo(
      process,
      { clipPath: 'inset(0% 3% 0% 3% round 48px)' },
      {
        clipPath: 'inset(0% 0% 0% 0% round 0px)',
        ease: 'none',
        scrollTrigger: { trigger: process, start: 'top bottom', end: 'top 35%', scrub: 0.5 },
      },
    );
  }

  const year = document.querySelector('[data-year] span');
  if (year) {
    const split = SplitText.create(year, { type: 'chars', mask: 'chars' });
    gsap.from(split.chars, {
      yPercent: 110,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.07,
      scrollTrigger: { trigger: year, start: 'top 85%', once: true },
    });
  }
}

/* ---------- Magnetic buttons (fine pointers only) ---------- */

function magnetic() {
  const cleanups: (() => void)[] = [];
  $$('[data-magnetic]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.18);
      y((e.clientY - r.top - r.height / 2) * 0.28);
    };
    const leave = () => {
      x(0);
      y(0);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    cleanups.push(() => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      gsap.set(el, { clearProps: 'transform' });
    });
  });
  return () => cleanups.forEach((c) => c());
}

/* ---------- Process timeline (state, runs for everyone) ---------- */

function processTimeline(withMotion: boolean) {
  const wrap = document.querySelector('[data-steps]');
  if (!wrap) return () => {};
  const steps = $$('[data-step]', wrap);
  const scenes = $$('[data-scene]');
  const counter = document.querySelector('[data-process-current]');
  const fill = wrap.querySelector('[data-steps-fill]');
  let current = -1;

  const setActive = (i: number) => {
    if (i === current) return;
    current = i;
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    scenes.forEach((s, k) => s.classList.toggle('is-active', k === i));
    if (counter) counter.textContent = String(i + 1).padStart(2, '0');
  };

  wrap.classList.add('steps--live');
  const triggers = steps.map((step, i) =>
    ScrollTrigger.create({
      trigger: step,
      start: 'top 62%',
      end: 'bottom 62%',
      onToggle: (self) => self.isActive && setActive(i),
    }),
  );
  const fillTween = fill
    ? gsap.fromTo(
        fill,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: wrap, start: 'top 62%', end: 'bottom 62%', scrub: withMotion ? 0.4 : true },
        },
      )
    : null;
  setActive(0);

  return () => {
    triggers.forEach((t) => t.kill());
    fillTween?.scrollTrigger?.kill();
    fillTween?.kill();
    wrap.classList.remove('steps--live');
  };
}

export function initMotion() {
  const mm = gsap.matchMedia();

  mm.add(
    {
      motion: '(prefers-reduced-motion: no-preference)',
      reduced: '(prefers-reduced-motion: reduce)',
      desktop: '(min-width: 1041px)',
      fine: '(hover: hover) and (pointer: fine)',
    },
    (ctx) => {
      const { motion, desktop, fine } = ctx.conditions as Record<string, boolean>;
      const cleanups: (() => void)[] = [];

      cleanups.push(processTimeline(motion));

      if (motion) {
        heroScroll();
        if (desktop && fine) cleanups.push(heroPointer());
        cleanups.push(splitHeadings());
        cleanups.push(reveals());
        cleanups.push(ledger());
        parallax();
        if (fine) cleanups.push(magnetic());
      }

      return () => cleanups.forEach((c) => c());
    },
  );

  // Fonts change line lengths; recalculate trigger positions once they load.
  document.fonts?.ready.then(() => ScrollTrigger.refresh()).catch(() => {});
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}
