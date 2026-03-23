import { api } from './api.js';
import { getSession, isAdmin, isJefe, isVendedor } from './session.js';
import { $, badgeBoolean, confirmAction, setHidden, showError } from './ui.js';
import { openFollowUpModal } from './seguimientos.js';

/**
 * =========================================================
 * Referencias del módulo clientes
 * =========================================================
 */
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
let currentAssignableTargets = [];

/**
 * =========================================================
 * Helpers
 * =========================================================
 */
function getCurrentRole() {
  return getSession().role;
}

function isCargador() {
  return getCurrentRole() === 'CARGADOR';
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

function closeModal() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  setHidden(modal, true);
  setHidden(overlay, true);
}

/**
 * =========================================================
 * Destinos asignables
 * =========================================================
 */
async function fetchAssignableTargets() {
  currentAssignableTargets = await api.listAssignableTargets();
  return currentAssignableTargets;
}

async function populateAssignableTargetSelect(selectedId = null) {
  cf_vendedor.innerHTML = '<option value="">Seleccione un destino</option>';

  const targets = await fetchAssignableTargets();

  targets.forEach((target) => {
    const option = document.createElement('option');
    option.value = String(target.id);
    option.textContent = `${target.nombre} ${target.apellido} | ${target.email} | ${target.role}`;

    if (selectedId && target.id === selectedId) {
      option.selected = true;
    }

    cf_vendedor.appendChild(option);
  });
}

/**
 * =========================================================
 * Payload CREATE
 * =========================================================
 */
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

  /**
   * Solo ADMIN puede gestionar lista negra
   */
  if (isAdmin()) {
    payload.listaNegra = cf_listaNegra.checked;
  }

  /**
   * ADMIN, JEFE y CARGADOR pueden asignar destino.
   * VENDEDOR no manda asignadoAId: backend lo autoasigna.
   */
  if (isAdmin() || isJefe() || isCargador()) {
    const targetId = Number(cf_vendedor.value || 0);
    if (targetId) {
      payload.asignadoAId = targetId;
    }
  }

  return payload;
}

/**
 * =========================================================
 * Payload UPDATE
 * =========================================================
 */
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

  /**
   * Solo ADMIN puede tocar lista negra
   */
  if (isAdmin()) {
    payload.listaNegra = cf_listaNegra.checked;
  }

  /**
   * ADMIN y JEFE pueden reasignar
   * VENDEDOR no
   * CARGADOR no edita clientes asignados
   */
  if (isAdmin() || isJefe()) {
    const targetId = Number(cf_vendedor.value || 0);
    if (targetId) {
      payload.asignadoAId = targetId;
    }
  }

  return payload;
}

/**
 * =========================================================
 * Abrir modal crear
 * ---------------------------------------------------------
 * ADMIN    -> ve listaNegra + selector destino
 * JEFE     -> no ve listaNegra, sí ve selector
 * CARGADOR -> no ve listaNegra, sí ve selector
 * VENDEDOR -> no ve listaNegra, no ve selector
 * =========================================================
 */
async function openCreateModal() {
  resetForm();
  modalTitle.textContent = 'Crear cliente';
  modalSubtitle.textContent = 'Completa los datos necesarios.';

  setHidden(row_listaNegra, !isAdmin());
  setHidden(row_vendedor, !(isAdmin() || isJefe() || isCargador()));

  try {
    if (isAdmin() || isJefe() || isCargador()) {
      await populateAssignableTargetSelect();
    }
  } catch (error) {
    showError(clientFormError, error.message);
  }

  setHidden(modal, false);
  setHidden(overlay, false);
}

/**
 * =========================================================
 * Abrir modal editar
 * ---------------------------------------------------------
 * ADMIN -> puede cambiar destino y lista negra
 * JEFE  -> puede cambiar destino
 * VENDEDOR -> no cambia destino
 * CARGADOR -> no debería editar asignados
 * =========================================================
 */
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
  setHidden(row_vendedor, !(isAdmin() || isJefe()));

  if (isAdmin() || isJefe()) {
    await populateAssignableTargetSelect(client.asignadoA?.id ?? null);
  }

  setHidden(modal, false);
  setHidden(overlay, false);
}

/**
 * =========================================================
 * Render tabla
 * =========================================================
 */
function renderTable(clients) {
  const canBlacklist = isAdmin();
  const canOpenEdit = !isCargador();

  setHidden(blacklistHead, !isAdmin());
  clientsBody.innerHTML = '';

  clients.forEach((client) => {
    const tr = document.createElement('tr');

  tr.innerHTML = `
    <td>${client.id}</td>
    <td>${client.nombres ?? '-'}</td>
    <td>${client.apellidos ?? '-'}</td>
    <td>${client.dni ?? '-'}</td>
    <td>${client.asignadoA?.email ?? '-'}</td>
    <td>${client.metodoSeguimiento ?? '-'}</td>

    <!-- CAMBIO FUTURO: nueva columna visible con días desde la última gestión -->
    <td>${client.diasDesdeUltimaGestion ?? '-'}</td>

    <td>${client.observaciones ?? '-'}</td>
    <td>${badgeBoolean(client.simulacion)}</td>
    ${isAdmin() ? `<td>${badgeBoolean(client.listaNegra)}</td>` : ''}
    <td>
      <div class="cell-actions">
        <!-- NOMBRES BOTONES DE ACCION -->
        <button class="btn btn-outline" data-follow="${client.id}" type="button">Gestion</button>
        ${canOpenEdit ? `<button class="btn btn-outline" data-edit="${client.id}" type="button">Editar</button>` : ''}
        ${canBlacklist ? `<button class="btn btn-danger" data-del="${client.id}" type="button">Lista negra</button>` : ''}
      </div>
    </td>
  `;

    clientsBody.appendChild(tr);
  });

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

      if (!confirmAction(`¿Poner cliente #${id} en lista negra?`)) return;

      try {
        await api.deleteClient(id);
        await loadClients();
      } catch (error) {
        showError(clientsMsg, error.message);
      }
    });
  });
}

/**
 * =========================================================
 * Load clients
 * =========================================================
 */
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

/**
 * =========================================================
 * Bind global
 * =========================================================
 */
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

      /**
       * CREATE
       * ADMIN / JEFE / CARGADOR necesitan destino explícito.
       * VENDEDOR no.
       */
      if (!id && (isAdmin() || isJefe() || isCargador()) && !payload.asignadoAId) {
        showError(clientFormError, 'Debes seleccionar un destino asignado.');
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