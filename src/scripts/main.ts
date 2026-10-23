import { initUI } from './ui';
import { initForm } from './form';
import { initMotion } from './motion';

const startMotion = () => {
  try {
    initMotion();
  } catch (error) {
    // Motion is optional: if it fails, the page stays fully readable.
    document.documentElement.classList.add('motion-off');
    console.warn('Animations are disabled:', error);
  }
  document.documentElement.classList.add('motion-ready');
};

const start = () => {
  initUI();
  initForm();
  // Scroll effects are set up when the browser is idle, after the first paint.
  if ('requestIdleCallback' in window) window.requestIdleCallback(startMotion, { timeout: 1200 });
  else window.setTimeout(startMotion, 200);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
