import { api } from './api.js';
import { $, showError } from './ui.js';
import { clearSession, setSession } from './session.js';

const loginForm = $('#loginForm');
const loginError = $('#loginError');

function redirectByRole(role) {
  if (role === 'ADMIN') {
    window.location.href = '/admin.html';
    return;
  }

  if (role === 'JEFE') {
    window.location.href = '/jefe.html';
    return;
  }

  if (role === 'VENDEDOR') {
    window.location.href = '/vendedor.html';
    return;
  }

  window.location.href = '/';
}

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

    redirectByRole(data.user.role);
  } catch (error) {
    showError(loginError, error.message);
    console.error('Login error:', error);
  }
});

/**
 * Limpiar sesión al volver al login
 */
clearSession();