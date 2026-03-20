// ==== Estado simple ====
const state = {
  token: localStorage.getItem('token') || '',
  role: localStorage.getItem('role') || '',
  userId: Number(localStorage.getItem('userId') || 0),
};

const $ = (q) => document.querySelector(q);
const loginView = $('#loginView');
const appView = $('#appView');
const roleBadge = $('#roleBadge');
const logoutBtn = $('#logoutBtn');
const loginForm = $('#loginForm');
const loginError = $('#loginError');

const clientsBody = $('#clientsBody');
const clientsMsg = $('#clientsMsg');
const reloadBtn = $('#reloadClients');
const createBtn = $('#createClient');

// ==== Helpers ====
function setSession({ token, role, userId }) {
  state.token = token; state.role = role; state.userId = userId;
  localStorage.setItem('token', token);
  localStorage.setItem('role', role);
  localStorage.setItem('userId', String(userId));
}

function clearSession() {
  state.token = ''; state.role = ''; state.userId = 0;
  localStorage.clear();
}

function authHeaders() {
  return state.token ? { 'Authorization': `Bearer ${state.token}` } : {};
}

function showApp() {
  if (state.token) {
    loginView.classList.add('hidden');
    appView.classList.remove('hidden');
    roleBadge.textContent = `Rol: ${state.role}`;
  } else {
    appView.classList.add('hidden');
    loginView.classList.remove('hidden');
    roleBadge.textContent = '';
  }
}

// ==== API ====
const API = {
  async login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.message || 'Credenciales inválidas');
    }
    return res.json();
  },

  async listClients() {
    const res = await fetch('/api/clients', { headers: { ...authHeaders() } });
    if (!res.ok) throw new Error('No se pudo listar clientes');
    return res.json();
  },

  async createClientMinimal() {
    // Crea un cliente simple; en el back se auto-asigna si eres VENDEDOR
    const body = {
      nombres: 'Cliente ' + Math.floor(Math.random() * 1000),
      apellidos: 'Demo',
      // Si quieres especificar: creadoPor / vendedorAsignado (ids)
    };
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.message || 'No se pudo crear el cliente');
    }
    return res.json();
  },

  async deleteClient(id) {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'DELETE',
      headers: { ...authHeaders() },
    });
    return res;
  },
};

// ==== UI events ====
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const email = $('#email').value.trim();
  const password = $('#password').value.trim();
  try {
    const data = await API.login(email, password);
    setSession({
      token: data.accessToken,
      role: data.user.role,
      userId: data.user.id,
    });
    showApp();
    await loadClients();
  } catch (err) {
    loginError.textContent = err.message;
  }
});

logoutBtn?.addEventListener('click', () => {
  clearSession();
  showApp();
});

reloadBtn?.addEventListener('click', async () => {
  await loadClients();
});

createBtn?.addEventListener('click', async () => {
  try {
    await API.createClientMinimal();
    await loadClients();
  } catch (e) {
    alert(e.message);
  }
});

// ==== Render ====
async function loadClients() {
  clientsBody.innerHTML = '';
  clientsMsg.textContent = 'Cargando...';
  try {
    const data = await API.listClients();
    clientsMsg.textContent = data.length ? '' : 'No hay clientes';

    for (const c of data) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${c.id}</td>
        <td>${c.nombres ?? '-'}</td>
        <td>${c.apellidos ?? '-'}</td>
        <td>${c.vendedorAsignado?.email ?? '-'}</td>
        <td>${c.simulacion ? 'Sí' : 'No'}</td>
        <td>
          <button class="btn btn-outline btn-sm" data-del="${c.id}">Eliminar</button>
        </td>
      `;
      clientsBody.appendChild(tr);
    }

    // Bind a botones eliminar (solo funciona si el rol lo permite; si no, 403)
    clientsBody.querySelectorAll('button[data-del]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-del');
        if (!confirm(`Eliminar cliente #${id}?`)) return;
        const res = await API.deleteClient(id);
        if (res.ok) {
          await loadClients();
        } else if (res.status === 403) {
          alert('No tienes permisos para eliminar (solo ADMIN)');
        } else {
          alert('No se pudo eliminar');
        }
      });
    });
  } catch (e) {
    clientsMsg.textContent = e.message;
  }
}

// ==== Init ====
showApp();
if (state.token) {
  loadClients();
}

// ---- refs modal ----
const modal = $('#modalCreate');
const mc_nombres = $('#mc_nombres');
const mc_apellidos = $('#mc_apellidos');
const mc_row_vendedor = $('#mc_row_vendedor');
const mc_vendedor = $('#mc_vendedor');
const mc_error = $('#mc_error');
const mc_cancel = $('#mc_cancel');
const mc_save = $('#mc_save');

// Listar usuarios y quedarnos con los vendedores
async function fetchSellers() {
  const res = await fetch('/api/users', { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('No se pudo obtener usuarios');
  const users = await res.json();
  return users.filter(u => u.role === 'VENDEDOR');
}

function openCreateModal() {
  // Limpia
  mc_error.textContent = '';
  mc_nombres.value = '';
  mc_apellidos.value = '';
  mc_vendedor.innerHTML = '';

  // Si eres ADMIN o JEFE, mostramos el selector
  const needsSeller = state.role === 'ADMIN' || state.role === 'JEFE';
  mc_row_vendedor.style.display = needsSeller ? '' : 'none';

  if (needsSeller) {
    // carga vendedores
    fetchSellers().then(sellers => {
      if (!sellers.length) {
        mc_error.textContent = 'No hay vendedores disponibles';
        return;
      }
      for (const s of sellers) {
        const opt = document.createElement('option');
        opt.value = String(s.id);
        opt.textContent = `${s.email} (id: ${s.id})`;
        mc_vendedor.appendChild(opt);
      }
    }).catch(err => mc_error.textContent = err.message);
  }

  modal.classList.remove('hidden');
}

function closeCreateModal() {
  modal.classList.add('hidden');
}

mc_cancel?.addEventListener('click', closeCreateModal);

// Reemplaza el listener del botón "Crear cliente"
createBtn?.addEventListener('click', openCreateModal);

// Guardar del modal
mc_save?.addEventListener('click', async () => {
  try {
    mc_error.textContent = '';
    const body = {
      nombres: mc_nombres.value.trim(),
      apellidos: mc_apellidos.value.trim(),
    };

    if (!body.nombres || !body.apellidos) {
      mc_error.textContent = 'Nombres y apellidos son obligatorios';
      return;
    }

    // ADMIN/JEFE deben enviar vendedorAsignado
    if (state.role === 'ADMIN' || state.role === 'JEFE') {
      const val = mc_vendedor.value;
      if (!val) {
        mc_error.textContent = 'Selecciona un vendedor';
        return;
      }
      body.vendedorAsignado = Number(val);
    }

    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const j = await res.json().catch(()=>({}));
      mc_error.textContent = j.message || 'No se pudo crear el cliente';
      return;
    }

    closeCreateModal();
    await loadClients();
  } catch (e) {
    mc_error.textContent = e.message;
  }
});