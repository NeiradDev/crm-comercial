//
// =========================================================
// CORE / PAGE-GUARD.JS
// ---------------------------------------------------------
// Este guard protege pantallas renderizadas por SSR
// usando la sesión guardada en localStorage.
// ---------------------------------------------------------
// IMPORTANTE:
// - La API sigue protegida por JWT en backend.
// - Este guard controla el acceso visual del frontend.
// =========================================================
//

import { clearSession, getSession, isLoggedIn } from './session.js';

// ----------------------------------------------------------
// HELPERS DE REDIRECCIÓN
// ----------------------------------------------------------
function goToLogin() {
  window.location.href = '/login';
}

function normalizeRole(role) {
  return String(role || '').trim().toUpperCase();
}

// ----------------------------------------------------------
// MUESTRA UN MENSAJE SIMPLE EN EL DOM
// ----------------------------------------------------------
function showGuardMessage(message) {
  const alertBox = document.getElementById('dashboardAlert');

  if (!alertBox) {
    return;
  }

  alertBox.textContent = message;
  alertBox.classList.remove('hidden');
  alertBox.classList.add('is-error');
}

// ----------------------------------------------------------
// MUESTRA EL SHELL SOLO CUANDO YA PASÓ LA VALIDACIÓN
// ----------------------------------------------------------
export function renderProtectedShell() {
  document.body.classList.add('dashboard-ready');
}

// ----------------------------------------------------------
// PROTEGE LA PÁGINA SEGÚN ROL REQUERIDO
// ----------------------------------------------------------
export function protectRolePage(requiredRole = '') {
  const normalizedRequiredRole = normalizeRole(requiredRole);
  const session = getSession();

  // --------------------------------------------------------
  // SI NO HAY SESIÓN, NO PUEDE ENTRAR
  // --------------------------------------------------------
  if (!isLoggedIn()) {
    clearSession();
    goToLogin();
    return false;
  }

  // --------------------------------------------------------
  // SI LA RUTA NO EXIGE ROL, SOLO DEJA PASAR
  // --------------------------------------------------------
  if (!normalizedRequiredRole) {
    return true;
  }

  // --------------------------------------------------------
  // SI EL ROL NO COINCIDE, BLOQUEA
  // --------------------------------------------------------
  if (normalizeRole(session.role) !== normalizedRequiredRole) {
    showGuardMessage(
      `No autorizado. Esta ruta requiere el rol ${normalizedRequiredRole}, pero tu sesión actual es ${session.role || 'DESCONOCIDO'}.`,
    );

    setTimeout(() => {
      goToLogin();
    }, 1800);

    return false;
  }

  return true;
}