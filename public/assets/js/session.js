const STORAGE_KEYS = {
  token: 'token',
  role: 'role',
  userId: 'userId',
  userEmail: 'userEmail',
};

export function getSession() {
  return {
    token: localStorage.getItem(STORAGE_KEYS.token) || '',
    role: localStorage.getItem(STORAGE_KEYS.role) || '',
    userId: Number(localStorage.getItem(STORAGE_KEYS.userId) || 0),
    userEmail: localStorage.getItem(STORAGE_KEYS.userEmail) || '',
  };
}

export function setSession({ token, role, userId, userEmail }) {
  localStorage.setItem(STORAGE_KEYS.token, token ?? '');
  localStorage.setItem(STORAGE_KEYS.role, role ?? '');
  localStorage.setItem(STORAGE_KEYS.userId, String(userId ?? 0));
  localStorage.setItem(STORAGE_KEYS.userEmail, userEmail ?? '');
}

export function clearSession() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}

export function getAuthHeaders() {
  const { token } = getSession();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isLoggedIn() {
  const { token } = getSession();
  return Boolean(token);
}

export function isAdmin() {
  return getSession().role === 'ADMIN';
}

export function isJefe() {
  return getSession().role === 'JEFE';
}

export function isVendedor() {
  return getSession().role === 'VENDEDOR';
}