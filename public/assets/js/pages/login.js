//
// =========================================================
// LOGIN.JS - VERSIÓN AUTOSUFICIENTE
// ---------------------------------------------------------
// Este archivo NO usa imports.
// La idea es eliminar por completo los fallos por rutas,
// módulos o dependencias externas mientras validamos el flujo.
// =========================================================
//

(function () {
  // -------------------------------------------------------
  // HELPERS BÁSICOS
  // -------------------------------------------------------
  function $(selector) {
    return document.querySelector(selector);
  }

  function setError(message) {
    const box = $('#loginMessage');
    if (!box) return;
    box.textContent = message || '';
  }

  function setLoading(isLoading) {
    const btn = $('#loginSubmitBtn');
    if (!btn) return;

    btn.disabled = isLoading;
    btn.textContent = isLoading ? 'Ingresando...' : 'Ingresar';
  }

  function clearSession() {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_role');
    localStorage.removeItem('crm_user_id');
    localStorage.removeItem('crm_user_email');

    // Compatibilidad por si quedaron claves viejas
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
  }

  function setSession(data) {
    localStorage.setItem('crm_token', data.token || '');
    localStorage.setItem('crm_role', data.role || '');
    localStorage.setItem('crm_user_id', String(data.userId || 0));
    localStorage.setItem('crm_user_email', data.userEmail || '');
  }

  function redirectByRole(role) {
    const normalizedRole = String(role || '').trim().toUpperCase();

    if (normalizedRole === 'ADMIN') {
      window.location.href = '/admin';
      return;
    }

    if (normalizedRole === 'JEFE') {
      window.location.href = '/supervisor';
      return;
    }

    if (normalizedRole === 'VENDEDOR') {
      window.location.href = '/vendor';
      return;
    }

    if (normalizedRole === 'CARGADOR') {
      window.location.href = '/admin';
      return;
    }

    window.location.href = '/login';
  }

  // -------------------------------------------------------
  // DOM
  // -------------------------------------------------------
  const loginForm = $('#loginForm');
  const emailInput = $('#email');
  const passwordInput = $('#password');

  // -------------------------------------------------------
  // SANIDAD BÁSICA
  // -------------------------------------------------------
  if (!loginForm || !emailInput || !passwordInput) {
    console.error('Login: no se encontraron los elementos base del formulario.');
    return;
  }

  // -------------------------------------------------------
  // Limpiar sesión cada vez que se entra al login
  // -------------------------------------------------------
  clearSession();

  // -------------------------------------------------------
  // SUBMIT
  // -------------------------------------------------------
  loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    setError('');

    const email = String(emailInput.value || '').trim();
    const password = String(passwordInput.value || '').trim();

    if (!email || !password) {
      setError('Debes ingresar correo y contraseña.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      const data = isJson
        ? await response.json().catch(function () { return {}; })
        : await response.text().catch(function () { return ''; });

      if (!response.ok) {
        const message = Array.isArray(data?.message)
          ? data.message.join('\n')
          : data?.message || data?.error || 'No se pudo iniciar sesión';

        throw new Error(message);
      }

      const token = data?.accessToken ?? data?.access_token ?? '';
      const user = data?.user ?? {};

      if (!token) {
        throw new Error('La respuesta del login no trajo token.');
      }

      if (!user?.role) {
        throw new Error('La respuesta del login no trajo el rol del usuario.');
      }

      setSession({
        token: token,
        role: user.role,
        userId: user.id ?? 0,
        userEmail: user.email ?? email,
      });

      redirectByRole(user.role);
    } catch (error) {
      console.error('Login error:', error);
      setError(error?.message || 'No se pudo iniciar sesión');
      setLoading(false);
    }
  });
})();