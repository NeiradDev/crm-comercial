//
// =========================================================
// CORE / SESSION.JS
// ---------------------------------------------------------
// Centraliza la sesión del frontend.
// Guarda, lee y expone helpers de rol y headers auth.
// =========================================================
//

const STORAGE_KEYS = {
  token: 'crm_token',
  role: 'crm_role',
  userId: 'crm_user_id',
  userEmail: 'crm_user_email',
};

function toSafeString(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function toSafeNumber(value) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
}

export function setSession(session = {}) {
  const token = toSafeString(session.token);
  const role = toSafeString(session.role).toUpperCase();
  const userId = toSafeNumber(session.userId);
  const userEmail = toSafeString(session.userEmail);

  localStorage.setItem(STORAGE_KEYS.token, token);
  localStorage.setItem(STORAGE_KEYS.role, role);
  localStorage.setItem(STORAGE_KEYS.userId, String(userId));
  localStorage.setItem(STORAGE_KEYS.userEmail, userEmail);
}

export function getSession() {
  return {
    token: toSafeString(localStorage.getItem(STORAGE_KEYS.token)),
    role: toSafeString(localStorage.getItem(STORAGE_KEYS.role)).toUpperCase(),
    userId: toSafeNumber(localStorage.getItem(STORAGE_KEYS.userId)),
    userEmail: toSafeString(localStorage.getItem(STORAGE_KEYS.userEmail)),
  };
}

export function getToken() {
  return getSession().token;
}

export function getRole() {
  return getSession().role;
}

export function isLoggedIn() {
  const session = getSession();
  return Boolean(session.token && session.role);
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.role);
  localStorage.removeItem(STORAGE_KEYS.userId);
  localStorage.removeItem(STORAGE_KEYS.userEmail);
}

export function getAuthHeaders() {
  const token = getToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export function isAdmin() {
  return getRole() === 'ADMIN';
}

export function isSupervisor() {
  return getRole() === 'JEFE';
}

export function isVendor() {
  return getRole() === 'VENDEDOR';
}

export function isLoader() {
  return getRole() === 'CARGADOR';
}