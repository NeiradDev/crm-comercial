import { api } from './api.js';
import { isAdmin } from './session.js';
import { $, setHidden, showError } from './ui.js';

const tabClients = $('#tabClients');
const tabUsers = $('#tabUsers');
const tabCreateUser = $('#tabCreateUser');

const clientsSection = $('#clientsSection');
const usersSection = $('#usersSection');
const createUserSection = $('#createUserSection');

const vendorsMsg = $('#vendorsMsg');
const vendorsBody = $('#vendorsBody');
const reloadVendors = $('#reloadVendors');

const createUserForm = $('#createUserForm');
const createUserError = $('#createUserError');
const cu_email = $('#cu_email');
const cu_password = $('#cu_password');
const cu_role = $('#cu_role');
const cu_jefeId = $('#cu_jefeId');
const createUserJefeRow = $('#createUserJefeRow');

const userEditModal = $('#userEditModal');
const userEditClose = $('#userEditClose');
const editUserCancel = $('#editUserCancel');
const editUserForm = $('#editUserForm');
const editUserError = $('#editUserError');
const eu_id = $('#eu_id');
const eu_email = $('#eu_email');
const eu_password = $('#eu_password');
const eu_role = $('#eu_role');
const eu_jefeId = $('#eu_jefeId');
const editUserJefeRow = $('#editUserJefeRow');

let currentUsers = [];
let currentJefes = [];

function activateTab(button) {
  [tabClients, tabUsers, tabCreateUser].forEach((btn) => {
    if (!btn) return;
    btn.classList.remove('btn-primary');
  });

  button?.classList.add('btn-primary');
}

function showSection(section) {
  [clientsSection, usersSection, createUserSection].forEach((sec) => {
    if (sec) setHidden(sec, sec !== section);
  });
}

export function bindTabEventsAdmin({ onShowClients }) {
  tabClients?.addEventListener('click', async () => {
    activateTab(tabClients);
    showSection(clientsSection);
    await onShowClients?.();
  });

  tabUsers?.addEventListener('click', async () => {
    activateTab(tabUsers);
    showSection(usersSection);
    await loadUsersAdmin();
  });

  tabCreateUser?.addEventListener('click', async () => {
    activateTab(tabCreateUser);
    showSection(createUserSection);
    await loadJefesForCreate();
  });
}

export function bindTabEventsJefe({ onShowClients }) {
  tabClients?.addEventListener('click', async () => {
    activateTab(tabClients);
    showSection(clientsSection);
    await onShowClients?.();
  });

  tabUsers?.addEventListener('click', async () => {
    activateTab(tabUsers);
    showSection(usersSection);
    await loadMyVendors();
  });
}

function resetCreateUserForm() {
  if (!createUserForm) return;

  cu_email.value = '';
  cu_password.value = '';
  cu_role.value = '';
  cu_jefeId.innerHTML = '';
  showError(createUserError, '');
  setHidden(createUserJefeRow, true);
}

function resetEditUserForm() {
  eu_id.value = '';
  eu_email.value = '';
  eu_password.value = '';
  eu_role.value = 'VENDEDOR';
  eu_jefeId.innerHTML = '';
  showError(editUserError, '');
  setHidden(editUserJefeRow, true);
}

function openEditModal() {
  setHidden(userEditModal, false);
  setHidden($('#modalOverlay'), false);
}

function closeEditModal() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  setHidden(userEditModal, true);
  setHidden($('#modalOverlay'), true);
}

function fillJefeSelect(selectElement, selectedId = null) {
  if (!selectElement) return;

  selectElement.innerHTML = '<option value="">Seleccione un jefe</option>';

  currentJefes.forEach((jefe) => {
    const option = document.createElement('option');
    option.value = String(jefe.id);
    option.textContent = `${jefe.email} (id: ${jefe.id})`;

    if (selectedId && jefe.id === selectedId) {
      option.selected = true;
    }

    selectElement.appendChild(option);
  });
}

async function loadJefesForCreate() {
  if (!isAdmin()) return;

  const users = await api.listUsers();
  currentJefes = users.filter((u) => u.role === 'JEFE');

  if (cu_role?.value === 'VENDEDOR') {
    fillJefeSelect(cu_jefeId);
    setHidden(createUserJefeRow, false);
  }
}

async function loadJefesForEdit(selectedId = null) {
  if (!isAdmin()) return;

  const users = await api.listUsers();
  currentJefes = users.filter((u) => u.role === 'JEFE');
  fillJefeSelect(eu_jefeId, selectedId);
}

export async function loadUsersAdmin() {
  vendorsMsg.textContent = 'Cargando...';
  vendorsBody.innerHTML = '';

  try {
    let users = await api.listUsers();
    users = users.filter((u) => u.role === 'JEFE' || u.role === 'VENDEDOR');
    currentUsers = users;

    vendorsMsg.textContent = users.length ? '' : 'No hay usuarios disponibles.';

    users.forEach((user) => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${user.id}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td>${user.jefe?.email ?? '-'}</td>
        <td>${user.createdAt ?? '-'}</td>
        <td>
          <div class="cell-actions">
            <button class="btn btn-outline" data-edit-user="${user.id}" type="button">Editar</button>
          </div>
        </td>
      `;

      vendorsBody.appendChild(tr);
    });

    vendorsBody.querySelectorAll('[data-edit-user]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = Number(button.getAttribute('data-edit-user'));
        await openEditUser(id);
      });
    });
  } catch (error) {
    vendorsMsg.textContent = error.message;
  }
}

export async function loadMyVendors() {
  vendorsMsg.textContent = 'Cargando...';
  vendorsBody.innerHTML = '';

  try {
    const users = await api.listMyVendors();
    currentUsers = users;

    vendorsMsg.textContent = users.length ? '' : 'No tienes vendedores asignados.';

    users.forEach((user) => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${user.id}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td>${user.jefe?.email ?? '-'}</td>
        <td>${user.createdAt ?? '-'}</td>
      `;

      vendorsBody.appendChild(tr);
    });
  } catch (error) {
    vendorsMsg.textContent = error.message;
  }
}

async function openEditUser(id) {
  const user = currentUsers.find((item) => item.id === id);
  if (!user) return;

  resetEditUserForm();

  eu_id.value = String(user.id);
  eu_email.value = user.email ?? '';
  eu_role.value = user.role ?? 'VENDEDOR';

  if (user.role === 'VENDEDOR') {
    await loadJefesForEdit(user.jefe?.id ?? null);
    setHidden(editUserJefeRow, false);
  } else {
    setHidden(editUserJefeRow, true);
    eu_jefeId.innerHTML = '';
  }

  openEditModal();
}

export function bindUserEvents() {
  reloadVendors?.addEventListener('click', async () => {
    if (isAdmin()) {
      await loadUsersAdmin();
    } else {
      await loadMyVendors();
    }
  });

  cu_role?.addEventListener('change', async () => {
    showError(createUserError, '');

    if (cu_role.value === 'VENDEDOR') {
      await loadJefesForCreate();
      setHidden(createUserJefeRow, false);
    } else {
      setHidden(createUserJefeRow, true);
      cu_jefeId.innerHTML = '';
    }
  });

  createUserForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError(createUserError, '');

    try {
      const payload = {
        email: cu_email.value.trim(),
        password: cu_password.value.trim(),
        role: cu_role.value,
      };

      if (!payload.email || !payload.password || !payload.role) {
        showError(createUserError, 'Email, contraseña y rol son obligatorios.');
        return;
      }

      if (payload.role === 'VENDEDOR') {
        const jefeId = Number(cu_jefeId.value || 0);
        if (!jefeId) {
          showError(createUserError, 'Debes seleccionar un jefe para el vendedor.');
          return;
        }
        payload.jefeId = jefeId;
      }

      await api.createUser(payload);
      resetCreateUserForm();
      await loadUsersAdmin();
      activateTab(tabUsers);
      showSection(usersSection);
    } catch (error) {
      showError(createUserError, error.message);
    }
  });

  userEditClose?.addEventListener('click', closeEditModal);
  editUserCancel?.addEventListener('click', closeEditModal);

  eu_role?.addEventListener('change', async () => {
    showError(editUserError, '');

    if (eu_role.value === 'VENDEDOR') {
      await loadJefesForEdit();
      setHidden(editUserJefeRow, false);
    } else {
      setHidden(editUserJefeRow, true);
      eu_jefeId.innerHTML = '';
    }
  });

  editUserForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError(editUserError, '');

    try {
      const id = Number(eu_id.value || 0);
      if (!id) {
        showError(editUserError, 'No se encontró el id del usuario.');
        return;
      }

      const payload = {
        email: eu_email.value.trim(),
        role: eu_role.value,
      };

      const password = eu_password.value.trim();
      if (password) {
        payload.password = password;
      }

      if (payload.role === 'VENDEDOR') {
        const jefeId = Number(eu_jefeId.value || 0);
        if (!jefeId) {
          showError(editUserError, 'Debes seleccionar un jefe para el vendedor.');
          return;
        }
        payload.jefeId = jefeId;
      }

      await api.updateUser(id, payload);
      closeEditModal();
      await loadUsersAdmin();
    } catch (error) {
      showError(editUserError, error.message);
    }
  });
}