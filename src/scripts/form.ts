/**
 * Inquiry form: accessible validation, Netlify Forms submission and a
 * WhatsApp alternative. A success message is shown only after the server
 * confirms the submission.
 */
import { business, whatsappLink } from '../data/site';

declare global {
  interface Window {
    __INTIME_PREVIEW__?: boolean;
  }
}

const MESSAGES = {
  name: 'Խնդրում ենք նշել ձեր անունը։',
  contactEmpty: 'Խնդրում ենք նշել հեռախոսահամար կամ էլ. փոստ։',
  contactInvalid: 'Նշեք ճիշտ հեռախոսահամար (օրինակ՝ +374 XX XXX XXX) կամ էլ. փոստի հասցե։',
  topic: 'Ընտրեք հայտի թեման։',
  sending: 'Ուղարկվում է…',
  success: 'Շնորհակալություն։ Ձեր հայտն ուղարկված է։ Մենք կկապվենք ձեզ հետ։',
  error: `Հայտը չհաջողվեց ուղարկել։ Խնդրում ենք զանգահարել ${business.phones[0].display} կամ ուղարկել հայտը WhatsApp-ով։`,
  preview: `Սա կայքի նախադիտման տարբերակն է, և այստեղից հայտերը չեն ուղարկվում։ Օգտվեք «Ուղարկել WhatsApp-ով» կոճակից կամ զանգահարեք ${business.phones[0].display}։`,
  fixErrors: 'Խնդրում ենք ուղղել նշված դաշտերը։',
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const isPhone = (v: string) => /^\+?\d{8,15}$/.test(v.replace(/[\s\-().]/g, ''));

export function initForm() {
  const form = document.querySelector<HTMLFormElement>('[data-inquiry-form]');
  if (!form) return;

  const status = form.querySelector<HTMLElement>('[data-form-status]');
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]');
  const submitLabel = form.querySelector<HTMLElement>('[data-submit-label]');
  const wa = form.querySelector<HTMLAnchorElement>('[data-whatsapp-send]');
  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;

  const setError = (name: string, message: string | null) => {
    const input = field(name);
    const wrap = input?.closest('.field');
    const out = form.querySelector<HTMLElement>(`[data-error-for="${name}"]`);
    if (!input || !wrap) return;
    wrap.classList.toggle('has-error', Boolean(message));
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (out) out.textContent = message ?? '';
  };

  const check = (name: string): boolean => {
    const value = (field(name)?.value ?? '').trim();
    let message: string | null = null;
    if (name === 'name' && !value) message = MESSAGES.name;
    if (name === 'contact') {
      if (!value) message = MESSAGES.contactEmpty;
      else if (!EMAIL.test(value) && !isPhone(value)) message = MESSAGES.contactInvalid;
    }
    if (name === 'topic' && !value) message = MESSAGES.topic;
    setError(name, message);
    return !message;
  };

  const required = ['name', 'contact', 'topic'];
  required.forEach((name) => {
    const input = field(name);
    input?.addEventListener('blur', () => {
      if (input.value.trim() || input.closest('.field')?.classList.contains('has-error')) check(name);
    });
    input?.addEventListener('input', () => {
      if (input.closest('.field')?.classList.contains('has-error')) check(name);
    });
    input?.addEventListener('change', () => {
      if (input.closest('.field')?.classList.contains('has-error')) check(name);
    });
  });

  const setStatus = (state: 'sending' | 'success' | 'error' | 'preview' | 'invalid' | null, text = '') => {
    if (!status) return;
    if (!state) {
      status.hidden = true;
      status.textContent = '';
      status.removeAttribute('data-state');
      return;
    }
    status.hidden = false;
    status.dataset.state = state === 'invalid' ? 'error' : state;
    status.textContent = text;
  };

  // Keep the WhatsApp link in sync with what the visitor typed.
  const composeWhatsApp = () => {
    if (!wa) return;
    const v = (n: string) => (field(n)?.value ?? '').trim();
    const lines = [
      'Բարև Ձեզ։ Հայտ In Time-ի կայքից։',
      v('name') && `Անուն՝ ${v('name')}`,
      v('company') && `Ընկերություն՝ ${v('company')}`,
      v('contact') && `Կապ՝ ${v('contact')}`,
      v('topic') && `Թեմա՝ ${v('topic')}`,
      v('message') && `Հաղորդագրություն՝ ${v('message')}`,
    ].filter(Boolean);
    wa.href = whatsappLink(lines.join('\n'));
  };
  form.addEventListener('input', composeWhatsApp);
  form.addEventListener('change', composeWhatsApp);
  composeWhatsApp();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const results = required.map((n) => [n, check(n)] as const);
    const firstInvalid = results.find(([, ok]) => !ok);
    if (firstInvalid) {
      setStatus('invalid', MESSAGES.fixErrors);
      field(firstInvalid[0])?.focus();
      return;
    }

    // Honeypot filled → silently ignore (bots only).
    if ((field('bot-field')?.value ?? '').trim()) return;

    if (window.__INTIME_PREVIEW__) {
      setStatus('preview', MESSAGES.preview);
      return;
    }

    setStatus('sending', MESSAGES.sending);
    if (submit) submit.disabled = true;
    if (submitLabel) submitLabel.textContent = MESSAGES.sending;

    try {
      const body = new URLSearchParams();
      new FormData(form).forEach((value, key) => body.append(key, String(value)));
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('success', MESSAGES.success);
      form.reset();
      composeWhatsApp();
    } catch {
      setStatus('error', MESSAGES.error);
    } finally {
      if (submit) submit.disabled = false;
      if (submitLabel) submitLabel.textContent = 'Ուղարկել հայտը';
    }
  });
}
