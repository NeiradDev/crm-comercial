import { api } from '../core/api.js';
import { isAdmin, isSupervisor } from '../core/session.js';
import { $, badgeBoolean, confirmAction, setHidden, showError } from '../core/ui.js';
import { openFollowUpModal } from './followups.js';

const clientsBody = $('#clientsBody');
const clientsMsg = $('#clientsMsg');
const reloadBtn = $('#reloadClients');
const createBtn = $('#createClient');
const assignedHead = $('#assignedHead');
const blacklistHead = $('#blacklistHead');

const clientsSearch = $('#clientsSearch');
const clientsPageSize = $('#clientsPageSize');
const clientsPrevPage = $('#clientsPrevPage');
const clientsNextPage = $('#clientsNextPage');
const clientsPageIndicator = $('#clientsPageIndicator');

const modal = $('#clientModal');
const overlay = $('#modalOverlay');
const modalTitle = $('#clientModalTitle');
const modalSubtitle = $('#clientModalSubtitle');
const modalClose = $('#clientModalClose');
const clientCancelBtn = $('#clientCancelBtn');

const clientForm = $('#clientForm');
const clientFormError = $('#clientFormError');
const clientId = $('#clientId');
const cf_nombres = $('#cf_nombres');
const cf_apellidos = $('#cf_apellidos');
const cf_dni = $('#cf_dni');
const cf_metodoPago = $('#cf_metodoPago');
const cf_metodoSeguimiento = $('#cf_metodoSeguimiento');
const cf_observaciones = $('#cf_observaciones');
const cf_simulacion = $('#cf_simulacion');
const cf_listaNegra = $('#cf_listaNegra');
const cf_asignadoA = $('#cf_asignadoA');
const row_asignadoA = $('#row_asignadoA');
const row_listaNegra = $('#row_listaNegra');

let currentClients = [];
let filteredClients = [];
let currentPage = 1;
let pageSize = 10;
let searchTerm = '';

function hasClientsDom() {
  return Boolean(
    clientsBody &&
      clientsMsg &&
      clientsSearch &&
      clientsPageSize &&
      clientsPrevPage &&
      clientsNextPage &&
      clientsPageIndicator,
  );
}

function getAssignedLabel(target) {
  if (!target) {
    return '-';
  }

  const name = [target.nombre, target.apellido].filter(Boolean).join(' ').trim();

  if (name && target.email) {
    return `${name} (${target.email})`;
  }

  return name || target.email || `ID ${target.id}`;
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function clientMatchesSearch(client, term) {
  if (!term) {
    return true;
  }

  const haystack = [
    client.id,
    client.nombres,
    client.apellidos,
    client.dni,
    client.metodoSeguimiento,
    client.observaciones,
    client.metodoPago,
    getAssignedLabel(client.asignadoA),
  ]
    .map(normalizeText)
    .join(' | ');

  return haystack.includes(term);
}

function getVisibleColumnCount() {
  return isAdmin() ? 10 : 9;
}

function getTotalPages() {
  return Math.max(1, Math.ceil(filteredClients.length / pageSize));
}

function getPageSlice() {
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;

  return filteredClients.slice(start, end);
}

function renderPaginationState() {
  const total = filteredClients.length;
  const totalPages = getTotalPages();

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);

  clientsPageIndicator.textContent = `Página ${currentPage} de ${totalPages}`;
  clientsPrevPage.disabled = currentPage <= 1;
  clientsNextPage.disabled = currentPage >= totalPages;

  if (total === 0) {
    clientsMsg.textContent = searchTerm
      ? 'No hay resultados para tu búsqueda.'
      : 'No hay clientes disponibles.';
    return;
  }

  const totalOriginal = currentClients.length;

  if (searchTerm) {
    clientsMsg.textContent = `Mostrando ${start}-${end} de ${total} resultados filtrados (total general: ${totalOriginal}).`;
    return;
  }

  clientsMsg.textContent = `Mostrando ${start}-${end} de ${total} clientes.`;
}

function getCreatePayload() {
  const payload = {
    nombres: cf_nombres.value.trim(),
    apellidos: cf_apellidos.value.trim(),
    dni: cf_dni.value.trim(),
    metodoPago: cf_metodoPago.value.trim() || undefined,
    metodoSeguimiento: cf_metodoSeguimiento.value.trim() || undefined,
    observaciones: cf_observaciones.value.trim() || undefined,
    simulacion: cf_simulacion.checked,
  };

  if (isAdmin()) {
    payload.listaNegra = cf_listaNegra.checked;
  }

  if (isAdmin() || isSupervisor()) {
    const assignedId = Number(cf_asignadoA.value || 0);

    if (assignedId) {
      payload.asignadoAId = assignedId;
    }
  }

  return payload;
}

function getUpdatePayload() {
  const payload = {
    nombres: cf_nombres.value.trim(),
    apellidos: cf_apellidos.value.trim(),
    dni: cf_dni.value.trim(),
    metodoPago: cf_metodoPago.value.trim() || undefined,
    metodoSeguimiento: cf_metodoSeguimiento.value.trim() || undefined,
    observaciones: cf_observaciones.value.trim() || undefined,
    simulacion: cf_simulacion.checked,
  };

  if (isAdmin()) {
    payload.listaNegra = cf_listaNegra.checked;

    const assignedId = Number(cf_asignadoA.value || 0);

    if (assignedId) {
      payload.asignadoAId = assignedId;
    }
  }

  return payload;
}

async function fetchAssignableTargets() {
  return api.listAssignableTargets();
}

function resetForm() {
  clientId.value = '';
  cf_nombres.value = '';
  cf_apellidos.value = '';
  cf_dni.value = '';
  cf_metodoPago.value = '';
  cf_metodoSeguimiento.value = '';
  cf_observaciones.value = '';
  cf_simulacion.checked = false;
  cf_listaNegra.checked = false;
  cf_asignadoA.innerHTML = '';
  showError(clientFormError, '');
}

async function populateAssignedSelect(selectedId = null) {
  cf_asignadoA.innerHTML = '<option value="">Seleccione un destino</option>';

  const targets = await fetchAssignableTargets();

  targets.forEach((target) => {
    const option = document.createElement('option');
    option.value = String(target.id);
    option.textContent = getAssignedLabel(target);

    if (selectedId && Number(target.id) === Number(selectedId)) {
      option.selected = true;
    }

    cf_asignadoA.appendChild(option);
  });
}

async function openCreateModal() {
  resetForm();
  modalTitle.textContent = 'Crear cliente';
  modalSubtitle.textContent = 'Registra un nuevo cliente según tu rol.';

  setHidden(row_listaNegra, !isAdmin());
  setHidden(row_asignadoA, !(isAdmin() || isSupervisor()));

  try {
    if (isAdmin() || isSupervisor()) {
      await populateAssignedSelect();
    }
  } catch (error) {
    showError(clientFormError, error.message);
  }

  setHidden(modal, false);
  setHidden(overlay, false);
}

async function openEditModal(id) {
  const client =
    currentClients.find((item) => item.id === id) ||
    (await api.getClientById(id));

  resetForm();

  clientId.value = String(client.id);
  modalTitle.textContent = `Editar cliente #${client.id}`;
  modalSubtitle.textContent = 'Actualiza los datos permitidos para tu rol.';

  cf_nombres.value = client.nombres ?? '';
  cf_apellidos.value = client.apellidos ?? '';
  cf_dni.value = client.dni ?? '';
  cf_metodoPago.value = client.metodoPago ?? '';
  cf_metodoSeguimiento.value = client.metodoSeguimiento ?? '';
  cf_observaciones.value = client.observaciones ?? '';
  cf_simulacion.checked = Boolean(client.simulacion);
  cf_listaNegra.checked = Boolean(client.listaNegra);

  setHidden(row_listaNegra, !isAdmin());
  setHidden(row_asignadoA, !isAdmin());

  if (isAdmin()) {
    await populateAssignedSelect(client.asignadoA?.id ?? null);
  }

  setHidden(modal, false);
  setHidden(overlay, false);
}

function closeModal() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  setHidden(modal, true);
  setHidden(overlay, true);
}

function bindRowActions() {
  clientsBody.querySelectorAll('[data-follow]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = Number(button.getAttribute('data-follow'));
      const client = currentClients.find((item) => item.id === id);

      if (client) {
        await openFollowUpModal(client);
      }
    });
  });

  clientsBody.querySelectorAll('[data-edit]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = Number(button.getAttribute('data-edit'));
      await openEditModal(id);
    });
  });

  clientsBody.querySelectorAll('[data-del]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = Number(button.getAttribute('data-del'));

      if (!confirmAction(`¿Enviar cliente #${id} a lista negra?`)) {
        return;
      }

      try {
        await api.deleteClient(id);
        await loadClients();
      } catch (error) {
        clientsMsg.textContent = error.message || 'No se pudo actualizar el cliente.';
      }
    });
  });
}

function renderEmptyState() {
  clientsBody.innerHTML = `
    <tr>
      <td colspan="${getVisibleColumnCount()}" class="table-empty-cell">
        ${
          searchTerm
            ? 'No se encontraron clientes con ese criterio de búsqueda.'
            : 'No hay clientes para mostrar.'
        }
      </td>
    </tr>
  `;
}

function renderTablePage() {
  const canDelete = isAdmin();
  const pageClients = getPageSlice();

  setHidden(assignedHead, false);
  setHidden(blacklistHead, !isAdmin());
  clientsBody.innerHTML = '';

  if (!pageClients.length) {
    renderEmptyState();
    renderPaginationState();
    return;
  }

  pageClients.forEach((client) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${client.id}</td>
      <td>${client.nombres ?? '-'}</td>
      <td>${client.apellidos ?? '-'}</td>
      <td>${client.dni ?? '-'}</td>
      <td>${getAssignedLabel(client.asignadoA)}</td>
      <td>${client.metodoSeguimiento ?? '-'}</td>
      <td>${client.observaciones ?? '-'}</td>
      <td>${badgeBoolean(client.simulacion)}</td>
      ${isAdmin() ? `<td>${badgeBoolean(client.listaNegra)}</td>` : ''}
      <td>
        <div class="cell-actions">
          <button class="btn btn-outline" data-follow="${client.id}" type="button">Seguimientos</button>
          <button class="btn btn-outline" data-edit="${client.id}" type="button">Editar</button>
          ${canDelete ? `<button class="btn btn-danger" data-del="${client.id}" type="button">Lista negra</button>` : ''}
        </div>
      </td>
    `;

    clientsBody.appendChild(tr);
  });

  bindRowActions();
  renderPaginationState();
}

function applyFiltersAndRender(resetToFirstPage = false) {
  if (resetToFirstPage) {
    currentPage = 1;
  }

  const normalizedTerm = normalizeText(searchTerm);

  filteredClients = currentClients.filter((client) =>
    clientMatchesSearch(client, normalizedTerm),
  );

  const totalPages = getTotalPages();

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  renderTablePage();
}

export async function loadClients() {
  if (!hasClientsDom()) {
    console.warn('clients.js: no existe la tabla de clientes en esta vista.');
    return;
  }

  clientsMsg.textContent = 'Cargando...';

  try {
    const clients = await api.listClients();

    currentClients = Array.isArray(clients) ? clients : [];
    applyFiltersAndRender(true);
  } catch (error) {
    currentClients = [];
    filteredClients = [];
    clientsBody.innerHTML = '';
    clientsMsg.textContent = error.message || 'No se pudieron cargar los clientes.';
    console.error('loadClients error:', error);
  }
}

export function bindClientEvents() {
  if (!hasClientsDom()) {
    console.warn('clients.js: no se encontró el DOM del módulo de clientes. Se omite el bind.');
    return;
  }

  reloadBtn?.addEventListener('click', async () => {
    await loadClients();
  });

  createBtn?.addEventListener('click', openCreateModal);
  modalClose?.addEventListener('click', closeModal);
  clientCancelBtn?.addEventListener('click', closeModal);

  clientsSearch?.addEventListener('input', () => {
    searchTerm = clientsSearch.value || '';
    applyFiltersAndRender(true);
  });

  clientsPageSize?.addEventListener('change', () => {
    pageSize = Number(clientsPageSize.value || 10);
    currentPage = 1;
    renderTablePage();
  });

  clientsPrevPage?.addEventListener('click', () => {
    if (currentPage <= 1) {
      return;
    }

    currentPage -= 1;
    renderTablePage();
  });

  clientsNextPage?.addEventListener('click', () => {
    const totalPages = getTotalPages();

    if (currentPage >= totalPages) {
      return;
    }

    currentPage += 1;
    renderTablePage();
  });

  clientForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError(clientFormError, '');

    try {
      const id = Number(clientId.value || 0);
      const payload = id ? getUpdatePayload() : getCreatePayload();

      if (!payload.nombres || !payload.apellidos || !payload.dni) {
        showError(
          clientFormError,
          'Nombres, apellidos y DNI son obligatorios.',
        );
        return;
      }

      if (!id && (isAdmin() || isSupervisor()) && !payload.asignadoAId) {
        showError(
          clientFormError,
          'Debes seleccionar un destino asignado.',
        );
        return;
      }

      if (id) {
        await api.updateClient(id, payload);
      } else {
        await api.createClient(payload);
      }

      closeModal();
      await loadClients();
    } catch (error) {
      showError(clientFormError, error.message);
    }
  });
}