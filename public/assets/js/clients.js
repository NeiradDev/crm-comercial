import { api } from './api.js';
import { getSession, isAdmin, isJefe, isVendedor } from './session.js';
import { $, badgeBoolean, confirmAction, setHidden, showError } from './ui.js';

const clientsBody = $('#clientsBody');
const clientsMsg = $('#clientsMsg');
const reloadBtn = $('#reloadClients');
const createBtn = $('#createClient');
const blacklistHead = $('#blacklistHead');

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
const cf_vendedor = $('#cf_vendedor');
const row_vendedor = $('#row_vendedor');
const row_listaNegra = $('#row_listaNegra');

let currentClients = [];

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

  if (isAdmin() || isJefe()) {
    const sellerId = Number(cf_vendedor.value || 0);
    if (sellerId) {
      payload.vendedorAsignadoId = sellerId;
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
    const sellerId = Number(cf_vendedor.value || 0);
    if (sellerId) {
      payload.vendedorAsignadoId = sellerId;
    }
  }

  return payload;
}

async function fetchSellers() {
  return api.listAssignableVendors();
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
  cf_vendedor.innerHTML = '';
  showError(clientFormError, '');
}

async function populateSellerSelect(selectedId = null) {
  cf_vendedor.innerHTML = '<option value="">Seleccione un vendedor</option>';

  const sellers = await fetchSellers();
  sellers.forEach((seller) => {
    const option = document.createElement('option');
    option.value = String(seller.id);
    option.textContent = `${seller.email} (id: ${seller.id})`;
    if (selectedId && seller.id === selectedId) {
      option.selected = true;
    }
    cf_vendedor.appendChild(option);
  });
}

async function openCreateModal() {
  resetForm();
  modalTitle.textContent = 'Crear cliente';
  modalSubtitle.textContent = 'Registra un nuevo cliente según tu rol.';
  setHidden(row_listaNegra, !isAdmin());
  setHidden(row_vendedor, !(isAdmin() || isJefe()));

  if (isAdmin() || isJefe()) {
    await populateSellerSelect();
  }

  setHidden(modal, false);
  setHidden(overlay, false);
}

async function openEditModal(id) {
  const client = currentClients.find((item) => item.id === id) || await api.getClientById(id);

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
  setHidden(row_vendedor, !isAdmin());

  if (isAdmin()) {
    await populateSellerSelect(client.vendedorAsignado?.id ?? null);
  }

  setHidden(modal, false);
  setHidden(overlay, false);
}

function closeModal() {
  setHidden(modal, true);
  setHidden(overlay, true);
}

function renderTable(clients) {
  const role = getSession().role;
  const canDelete = isAdmin();

  setHidden(blacklistHead, role !== 'ADMIN');
  clientsBody.innerHTML = '';

  clients.forEach((client) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${client.id}</td>
      <td>${client.nombres ?? '-'}</td>
      <td>${client.apellidos ?? '-'}</td>
      <td>${client.dni ?? '-'}</td>
      <td>${client.vendedorAsignado?.email ?? '-'}</td>
      <td>${client.metodoSeguimiento ?? '-'}</td>
      <td>${client.observaciones ?? '-'}</td>
      <td>${badgeBoolean(client.simulacion)}</td>
      ${role === 'ADMIN' ? `<td>${badgeBoolean(client.listaNegra)}</td>` : ''}
      <td>
        <div class="cell-actions">
          <button class="btn btn-outline" data-edit="${client.id}" type="button">Editar</button>
          ${canDelete ? `<button class="btn btn-danger" data-del="${client.id}" type="button">Eliminar</button>` : ''}
        </div>
      </td>
    `;

    clientsBody.appendChild(tr);
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

      if (!confirmAction(`¿Eliminar cliente #${id}?`)) return;

      try {
        await api.deleteClient(id);
        await loadClients();
      } catch (error) {
        showError(clientsMsg, error.message);
      }
    });
  });
}

export async function loadClients() {
  clientsMsg.textContent = 'Cargando...';

  try {
    const clients = await api.listClients();
    currentClients = clients;
    clientsMsg.textContent = clients.length ? '' : 'No hay clientes disponibles.';
    renderTable(clients);
  } catch (error) {
    currentClients = [];
    clientsBody.innerHTML = '';
    clientsMsg.textContent = error.message;
  }
}

export function bindClientEvents() {
  reloadBtn?.addEventListener('click', loadClients);
  createBtn?.addEventListener('click', openCreateModal);
  modalClose?.addEventListener('click', closeModal);
  clientCancelBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);

  clientForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError(clientFormError, '');

    try {
      const id = Number(clientId.value || 0);
      const payload = id ? getUpdatePayload() : getCreatePayload();

      if (!payload.nombres || !payload.apellidos || !payload.dni) {
        showError(clientFormError, 'Nombres, apellidos y DNI son obligatorios.');
        return;
      }

      if (!id && (isAdmin() || isJefe()) && !payload.vendedorAsignadoId) {
        showError(clientFormError, 'Debes seleccionar un vendedor asignado.');
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