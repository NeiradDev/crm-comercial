import { api } from '../core/api.js';
import { getSession, isAdmin, isSupervisor } from '../core/session.js';
import { $, confirmAction, setHidden, showError } from '../core/ui.js';

const usersMsg = $('#usersMsg');
const usersBody = $('#usersBody');
const reloadUsers = $('#reloadUsers');
const usersActionsHead = $('#usersActionsHead');

const createUserForm = $('#createUserForm');
const createUserError = $('#createUserError');
const cu_nombre = $('#cu_nombre');
const cu_apellido = $('#cu_apellido');
const cu_cedula = $('#cu_cedula');
const cu_email = $('#cu_email');
const cu_password = $('#cu_password');
const cu_role = $('#cu_role');
const cu_jefeId = $('#cu_jefeId');
const cu_activo = $('#cu_activo');
const createUserJefeRow = $('#createUserJefeRow');

let currentUsers = [];
let currentJefes = [];

function hasUsersDom() {
  return Boolean(usersMsg && usersBody && reloadUsers);
}

function hasCreateUserDom() {
  return Boolean(
    createUserForm &&
      cu_nombre &&
      cu_apellido &&
      cu_cedula &&
      cu_email &&
      cu_password &&
      cu_role &&
      cu_jefeId &&
      createUserJefeRow &&
      createUserError,
  );
}

function formatBoss(user) {
  if (!user?.jefe) {
    return '-';
  }

  const name = [user.jefe.nombre, user.jefe.apellido].filter(Boolean).join(' ').trim();

  if (name && user.jefe.email) {
    return `${name} (${user.jefe.email})`;
  }

  return name || user.jefe.email || `ID ${user.jefe.id}`;
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString();
}

function stateBadge(user) {
  return user?.activo
    ? '<span class="users-state-badge is-active">Activo</span>'
    : '<span class="users-state-badge is-inactive">Inactivo</span>';
}

function resetCreateUserForm() {
  if (!hasCreateUserDom()) {
    return;
  }

  cu_nombre.value = '';
  cu_apellido.value = '';
  cu_cedula.value = '';
  cu_email.value = '';
  cu_password.value = '';
  cu_role.value = '';
  cu_activo.checked = true;
  cu_jefeId.innerHTML = '<option value="">Seleccione un jefe</option>';
  setHidden(createUserJefeRow, true);
  showError(createUserError, '');
}

function fillBossSelect(selectedId = null) {
  if (!cu_jefeId) {
    return;
  }

  cu_jefeId.innerHTML = '<option value="">Seleccione un jefe</option>';

  currentJefes.forEach((boss) => {
    const option = document.createElement('option');
    option.value = String(boss.id);
    option.textContent = `${boss.nombre} ${boss.apellido} (${boss.email})`;

    if (selectedId && Number(selectedId) === Number(boss.id)) {
      option.selected = true;
    }

    cu_jefeId.appendChild(option);
  });
}

async function loadBossesForCreate() {
  if (!isAdmin()) {
    return;
  }

  const users = await api.listUsers();
  currentJefes = users.filter((user) => user.role === 'JEFE' && user.activo);
  fillBossSelect();
}

function getCreatePayload() {
  const payload = {
    nombre: cu_nombre.value.trim(),
    apellido: cu_apellido.value.trim(),
    cedula: cu_cedula.value.trim(),
    email: cu_email.value.trim(),
    password: cu_password.value.trim(),
    role: cu_role.value,
    activo: cu_activo.checked,
  };

  if (payload.role === 'VENDEDOR') {
    const jefeId = Number(cu_jefeId.value || 0);

    if (jefeId) {
      payload.jefeId = jefeId;
    }
  }

  return payload;
}

function renderEmptyUsersState(message) {
  usersBody.innerHTML = `
    <tr>
      <td colspan="${isAdmin() ? 10 : 9}" class="table-empty-cell">
        ${message}
      </td>
    </tr>
  `;
}

function bindUserRowActions() {
  if (!isAdmin()) {
    return;
  }

  usersBody.querySelectorAll('[data-deactivate-user]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = Number(button.getAttribute('data-deactivate-user'));
      const currentSession = getSession();

      if (id === Number(currentSession.userId)) {
        usersMsg.textContent = 'No puedes desactivarte a ti mismo desde esta pantalla.';
        return;
      }

      if (!confirmAction(`¿Desactivar usuario #${id}?`)) {
        return;
      }

      try {
        await api.deactivateUser(id);
        await loadUsersForCurrentRole();
      } catch (error) {
        usersMsg.textContent = error.message || 'No se pudo desactivar el usuario.';
      }
    });
  });
}

function renderUsersTable(users) {
  setHidden(usersActionsHead, !isAdmin());
  usersBody.innerHTML = '';

  if (!users.length) {
    renderEmptyUsersState(
      isAdmin()
        ? 'No hay usuarios para mostrar.'
        : 'No tienes vendedores asignados.',
    );
    return;
  }

  users.forEach((user) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${user.id}</td>
      <td>${user.nombre ?? '-'}</td>
      <td>${user.apellido ?? '-'}</td>
      <td>${user.cedula ?? '-'}</td>
      <td>${user.email ?? '-'}</td>
      <td>${user.role ?? '-'}</td>
      <td>${formatBoss(user)}</td>
      <td>${stateBadge(user)}</td>
      <td>${formatDate(user.createdAt)}</td>
      ${
        isAdmin()
          ? `
            <td>
              <div class="cell-actions">
                <button
                  class="btn btn-danger"
                  data-deactivate-user="${user.id}"
                  type="button"
                  ${user.activo ? '' : 'disabled'}
                >
                  ${user.activo ? 'Desactivar' : 'Inactivo'}
                </button>
              </div>
            </td>
          `
          : ''
      }
    `;

    usersBody.appendChild(tr);
  });

  bindUserRowActions();
}

export async function loadUsersForCurrentRole() {
  if (!hasUsersDom()) {
    console.warn('users.js: no existe el DOM del módulo de usuarios.');
    return;
  }

  usersMsg.textContent = 'Cargando...';
  usersBody.innerHTML = '';

  try {
    let users = [];

    if (isAdmin()) {
      users = await api.listUsers();
    } else if (isSupervisor()) {
      users = await api.listMyVendors();
    } else {
      users = [];
    }

    currentUsers = Array.isArray(users) ? users : [];

    usersMsg.textContent = currentUsers.length
      ? ''
      : isAdmin()
        ? 'No hay usuarios disponibles.'
        : 'No tienes vendedores asignados.';

    renderUsersTable(currentUsers);
  } catch (error) {
    currentUsers = [];
    usersBody.innerHTML = '';
    usersMsg.textContent = error.message || 'No se pudieron cargar los usuarios.';
    console.error('loadUsersForCurrentRole error:', error);
  }
}

export async function prepareCreateUserSection() {
  if (!hasCreateUserDom()) {
    return;
  }

  if (!isAdmin()) {
    resetCreateUserForm();
    return;
  }

  resetCreateUserForm();
  await loadBossesForCreate();
}

export function bindUserEvents() {
  if (hasUsersDom()) {
    reloadUsers?.addEventListener('click', async () => {
      await loadUsersForCurrentRole();
    });
  }

  if (!hasCreateUserDom()) {
    return;
  }

  cu_role?.addEventListener('change', async () => {
    showError(createUserError, '');

    if (cu_role.value === 'VENDEDOR') {
      await loadBossesForCreate();
      setHidden(createUserJefeRow, false);
    } else {
      setHidden(createUserJefeRow, true);
      cu_jefeId.innerHTML = '<option value="">Seleccione un jefe</option>';
    }
  });

  createUserForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError(createUserError, '');

    if (!isAdmin()) {
      showError(createUserError, 'Solo administrador puede crear usuarios.');
      return;
    }

    try {
      const payload = getCreatePayload();

      if (
        !payload.nombre ||
        !payload.apellido ||
        !payload.cedula ||
        !payload.email ||
        !payload.password ||
        !payload.role
      ) {
        showError(
          createUserError,
          'Nombre, apellido, cédula, email, contraseña y rol son obligatorios.',
        );
        return;
      }

      if (payload.role === 'VENDEDOR' && !payload.jefeId) {
        showError(
          createUserError,
          'Para crear un vendedor debes seleccionar un jefe.',
        );
        return;
      }

      await api.createUser(payload);

      // =====================================================
      // Refrescar catálogo de jefes por si acabas de crear uno
      // =====================================================
      await loadBossesForCreate();
      resetCreateUserForm();
      await loadUsersForCurrentRole();

      showError(createUserError, 'Usuario creado correctamente.');
    } catch (error) {
      showError(createUserError, error.message || 'No se pudo crear el usuario.');
    }
  });
}