import { api } from './api.js';
import { $, setHidden, showError } from './ui.js';
import { clearSession, getSession, isLoggedIn, setSession } from './session.js';

const loginView = $('#loginView');
const appView = $('#appView');
const roleBadge = $('#roleBadge');
const logoutBtn = $('#logoutBtn');
const loginForm = $('#loginForm');
const loginError = $('#loginError');

export function renderAuthState() {
  const session = getSession();

  if (isLoggedIn()) {
    setHidden(loginView, true);
    setHidden(appView, false);
    setHidden(logoutBtn, false);
    roleBadge.textContent = `Rol: ${session.role} | ${session.userEmail}`;
  } else {
    setHidden(loginView, false);
    setHidden(appView, true);
    setHidden(logoutBtn, true);
    roleBadge.textContent = '';
  }
}

export function bindAuthEvents({ onLoginSuccess, onLogout }) {
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError(loginError, '');

    const email = $('#email')?.value.trim();
    const password = $('#password')?.value.trim();

    try {
      const data = await api.login(email, password);

      setSession({
        token: data.accessToken,
        role: data.user.role,
        userId: data.user.id,
        userEmail: data.user.email,
      });

      renderAuthState();
      await onLoginSuccess?.();
    } catch (error) {
      showError(loginError, error.message);
      console.error('Login error:', error);
    }
  });

  logoutBtn?.addEventListener('click', () => {
    clearSession();
    renderAuthState();
    onLogout?.();
  });
}