export const $ = (selector) => document.querySelector(selector);

export function setHidden(element, hidden) {
  if (!element) return;
  element.classList.toggle('hidden', hidden);
}

export function showError(element, message = '') {
  if (!element) return;
  element.textContent = message || '';
}

export function toYesNo(value) {
  return value ? 'Sí' : 'No';
}

export function badgeBoolean(value) {
  return value
    ? '<span class="badge badge-ok">Sí</span>'
    : '<span class="badge badge-no">No</span>';
}

export function confirmAction(message) {
  return window.confirm(message);
}