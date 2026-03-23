import { clearSession, getSession, isLoggedIn } from './session.js';
import { $, setHidden } from './ui.js';

export function protectRolePage(requiredRole) {
  const session = getSession();

  if (!isLoggedIn()) {
    window.location.href = '/';
    return;
  }

  if (session.role !== requiredRole) {
    if (session.role === 'ADMIN') {
      window.location.href = '/admin.html';
      return;
    }

    if (session.role === 'JEFE') {
      window.location.href = '/jefe.html';
      return;
    }

    if (session.role === 'VENDEDOR') {
      window.location.href = '/vendedor.html';
      return;
    }

    window.location.href = '/';
  }
}

export function renderProtectedShell() {
  const roleBadge = $('#roleBadge');
  const logoutBtn = $('#logoutBtn');
  const session = getSession();

  if (roleBadge) {
    roleBadge.textContent = `Rol: ${session.role} | ${session.userEmail}`;
  }

  setHidden(logoutBtn, false);

  logoutBtn?.addEventListener('click', () => {
    clearSession();
    window.location.href = '/';
  });
}