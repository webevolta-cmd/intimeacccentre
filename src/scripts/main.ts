import { initUI } from './ui';
import { initForm } from './form';
import { initMotion } from './motion';

const start = () => {
  try {
    initUI();
    initForm();
  } finally {
    // Motion is optional: if it fails, the page stays fully readable.
    try {
      initMotion();
    } catch (error) {
      document.documentElement.classList.add('motion-off');
      console.warn('Animations are disabled:', error);
    }
    document.documentElement.classList.add('motion-ready');
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
