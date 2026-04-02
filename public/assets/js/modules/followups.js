import { api } from '../core/api.js';
import { $, badgeBoolean, setHidden, showError } from '../core/ui.js';

const FOLLOW_UP_OPTIONS = {
  origen: ['Facebook', 'Cuotitas', 'Contado', 'Tarjeta de Crédito'],
  metodoPago: ['Cuotitas', 'Contado', 'Tarjeta de Crédito'],
  insistencia: ['Llamada', 'Mensaje', 'Llamada/mensaje'],
  simulacion: [
    { label: 'Sí', value: 'true' },
    { label: 'No', value: 'false' },
  ],
  tipoCliente: ['A', 'B', 'C CLA', 'C1', 'C2', 'C3', 'D', 'D1', 'E'],
  resolucion: [
    'Sin E/Sin G',
    'Entrada Alta',
    'Entrada Media',
    'Entrada Mínima',
    'Garante',
    'Garante o Entrada',
    'Con G/Con E',
  ],
  documentacion: ['SI', 'NO'],
  referencias: ['COMPLETAS', 'FALTA'],
  verificacionIdentidad: ['COMPLETAS', 'FALTA'],
  facturado: [
    { label: 'Sí', value: 'true' },
    { label: 'No', value: 'false' },
  ],
  despachado: [
    { label: 'Sí', value: 'true' },
    { label: 'No', value: 'false' },
  ],
};

const modal = $('#followUpModal');
const overlay = $('#modalOverlay');
const closeBtn = $('#followUpModalClose');
const openFormBtn = $('#openFollowUpFormBtn');

const title = $('#followUpModalTitle');
const clientInfo = $('#followUpClientInfo');
const msg = $('#followUpMsg');
const body = $('#followUpBody');

const listView = $('#followUpListView');
const formView = $('#followUpFormView');

const form = $('#followUpForm');
const formError = $('#followUpFormError');
const backBtn = $('#followUpBackBtn');

const fu_id = $('#fu_id');
const fu_clientId = $('#fu_clientId');
const fu_fecha = $('#fu_fecha');
const fu_numeroCliente = $('#fu_numeroCliente');
const fu_origen = $('#fu_origen');
const fu_metodoPago = $('#fu_metodoPago');
const fu_insistencia = $('#fu_insistencia');
const fu_simulacion = $('#fu_simulacion');
const fu_tipoCliente = $('#fu_tipoCliente');
const fu_resolucion = $('#fu_resolucion');
const fu_documentacion = $('#fu_documentacion');
const fu_referencias = $('#fu_referencias');
const fu_verificacionIdentidad = $('#fu_verificacionIdentidad');
const fu_facturado = $('#fu_facturado');
const fu_despachado = $('#fu_despachado');
const fu_observaciones = $('#fu_observaciones');

let currentClient = null;
let currentFollowUps = [];

function hasFollowUpDom() {
  return Boolean(
    modal &&
    overlay &&
    body &&
    form &&
    fu_clientId &&
    fu_fecha &&
    fu_origen &&
    fu_metodoPago &&
    fu_insistencia &&
    fu_simulacion &&
    fu_tipoCliente &&
    fu_resolucion &&
    fu_documentacion &&
    fu_referencias &&
    fu_verificacionIdentidad &&
    fu_facturado &&
    fu_despachado
  );
}

function toBoolean(value) {
  return String(value) === 'true';
}

function fillSelect(selectElement, options, placeholder = 'Seleccione una opción') {
  if (!selectElement) return;

  selectElement.innerHTML = '';

  const first = document.createElement('option');
  first.value = '';
  first.textContent = placeholder;
  selectElement.appendChild(first);

  options.forEach((option) => {
    const opt = document.createElement('option');

    if (typeof option === 'string') {
      opt.value = option;
      opt.textContent = option;
    } else {
      opt.value = option.value;
      opt.textContent = option.label;
    }

    selectElement.appendChild(opt);
  });
}

function fillAllCatalogs() {
  fillSelect(fu_origen, FOLLOW_UP_OPTIONS.origen);
  fillSelect(fu_metodoPago, FOLLOW_UP_OPTIONS.metodoPago);
  fillSelect(fu_insistencia, FOLLOW_UP_OPTIONS.insistencia);
  fillSelect(fu_simulacion, FOLLOW_UP_OPTIONS.simulacion);
  fillSelect(fu_tipoCliente, FOLLOW_UP_OPTIONS.tipoCliente);
  fillSelect(fu_resolucion, FOLLOW_UP_OPTIONS.resolucion);
  fillSelect(fu_documentacion, FOLLOW_UP_OPTIONS.documentacion);
  fillSelect(fu_referencias, FOLLOW_UP_OPTIONS.referencias);
  fillSelect(fu_verificacionIdentidad, FOLLOW_UP_OPTIONS.verificacionIdentidad);
  fillSelect(fu_facturado, FOLLOW_UP_OPTIONS.facturado);
  fillSelect(fu_despachado, FOLLOW_UP_OPTIONS.despachado);
}

function resetFollowUpForm() {
  if (!hasFollowUpDom()) return;

  fu_id.value = '';
  fu_clientId.value = '';
  fu_fecha.value = new Date().toISOString().slice(0, 10);
  fu_numeroCliente.value = '';
  fu_origen.value = '';
  fu_metodoPago.value = '';
  fu_insistencia.value = '';
  fu_simulacion.value = '';
  fu_tipoCliente.value = '';
  fu_resolucion.value = '';
  fu_documentacion.value = '';
  fu_referencias.value = '';
  fu_verificacionIdentidad.value = '';
  fu_facturado.value = '';
  fu_despachado.value = '';
  fu_observaciones.value = '';
  showError(formError, '');
}

function openModal() {
  if (!modal || !overlay) return;
  setHidden(modal, false);
  setHidden(overlay, false);
}

function closeModal() {
  if (!modal || !overlay) return;

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  setHidden(modal, true);
  setHidden(overlay, true);
}

function showListView() {
  if (!listView || !formView) return;
  setHidden(listView, false);
  setHidden(formView, true);
}

function showFormView() {
  if (!listView || !formView) return;
  setHidden(listView, true);
  setHidden(formView, false);
}

function getFollowUpPayload() {
  return {
    clientId: Number(fu_clientId.value),
    fecha: fu_fecha.value,
    numeroCliente: fu_numeroCliente.value.trim() || undefined,
    origen: fu_origen.value,
    metodoPago: fu_metodoPago.value,
    insistencia: fu_insistencia.value,
    simulacion: toBoolean(fu_simulacion.value),
    tipoCliente: fu_tipoCliente.value,
    resolucion: fu_resolucion.value,
    documentacion: fu_documentacion.value,
    referencias: fu_referencias.value,
    verificacionIdentidad: fu_verificacionIdentidad.value,
    facturado: toBoolean(fu_facturado.value),
    despachado: toBoolean(fu_despachado.value),
    observaciones: fu_observaciones?.value?.trim() || undefined,
  };
}

function renderFollowUps(items) {
  if (!body) return;

  body.innerHTML = '';

  items.forEach((item) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${item.id}</td>
      <td>${item.fecha ?? '-'}</td>
      <td>${item.numeroCliente ?? '-'}</td>
      <td>${item.origen ?? '-'}</td>
      <td>${item.metodoPago ?? '-'}</td>
      <td>${item.insistencia ?? '-'}</td>
      <td>${badgeBoolean(item.simulacion)}</td>
      <td>${item.resolucion ?? '-'}</td>
      <td>${badgeBoolean(item.facturado)}</td>
      <td>${badgeBoolean(item.despachado)}</td>
      <td>${item.observaciones ?? '-'}</td>
    `;

    body.appendChild(tr);
  });
}

async function loadFollowUps() {
  if (!currentClient || !body || !msg) return;

  msg.textContent = 'Cargando seguimientos...';

  try {
    currentFollowUps = await api.listFollowUpsByClient(currentClient.id);
    msg.textContent = currentFollowUps.length
      ? ''
      : 'Este cliente todavía no tiene seguimientos registrados.';
    renderFollowUps(currentFollowUps);
  } catch (error) {
    currentFollowUps = [];
    body.innerHTML = '';
    msg.textContent = error.message;
  }
}

export async function openFollowUpModal(client) {
  if (!hasFollowUpDom()) {
    console.warn('El DOM de seguimientos todavía no existe en esta vista.');
    return;
  }

  currentClient = client;
  title.textContent = `Seguimientos del cliente #${client.id}`;
  clientInfo.textContent = `${client.nombres} ${client.apellidos} | DNI: ${client.dni}`;

  resetFollowUpForm();
  fu_clientId.value = String(client.id);

  showListView();
  openModal();
  await loadFollowUps();
}

function openNewFollowUpForm() {
  if (!hasFollowUpDom()) return;

  resetFollowUpForm();

  if (currentClient) {
    fu_clientId.value = String(currentClient.id);
    fu_numeroCliente.value = currentClient.numeroCliente ?? '';
  }

  showFormView();
}

export function bindFollowUpEvents() {
  if (!hasFollowUpDom()) {
    console.warn('followups.js: no se encontró el DOM del módulo de seguimientos. Se omite el bind.');
    return;
  }

  fillAllCatalogs();

  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', () => {
    if (!modal.classList.contains('hidden')) {
      closeModal();
    }
  });

  openFormBtn?.addEventListener('click', openNewFollowUpForm);
  backBtn?.addEventListener('click', showListView);

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError(formError, '');

    try {
      const payload = getFollowUpPayload();

      if (
        !payload.clientId ||
        !payload.fecha ||
        !payload.origen ||
        !payload.metodoPago ||
        !payload.insistencia ||
        !payload.tipoCliente ||
        !payload.resolucion ||
        !payload.documentacion ||
        !payload.referencias ||
        !payload.verificacionIdentidad
      ) {
        showError(formError, 'Completa todos los campos obligatorios del seguimiento.');
        return;
      }

      const id = Number(fu_id.value || 0);

      if (id) {
        await api.updateFollowUp(id, payload);
      } else {
        await api.createFollowUp(payload);
      }

      showListView();
      resetFollowUpForm();
      await loadFollowUps();
    } catch (error) {
      showError(formError, error.message);
    }
  });
}