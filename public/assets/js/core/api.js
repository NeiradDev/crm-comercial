import { getAuthHeaders } from './session.js';

/**
 * =========================================================
 * Parser central de respuestas HTTP
 * =========================================================
 */
async function parseResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  const data = isJson
    ? await res.json().catch(() => ({}))
    : await res.text().catch(() => '');

  if (!res.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join('\n')
      : data?.message || data?.error || 'Ocurrió un error en la petición';

    throw new Error(message);
  }

  return data;
}

export const api = {
  async login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    return parseResponse(res);
  },

  // =======================================================
  // CLIENTES
  // =======================================================
  async listClients() {
    const res = await fetch('/api/clients', {
      headers: { ...getAuthHeaders() },
    });

    return parseResponse(res);
  },

  async getClientById(id) {
    const res = await fetch(`/api/clients/${id}`, {
      headers: { ...getAuthHeaders() },
    });

    return parseResponse(res);
  },

  async createClient(body) {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(body),
    });

    return parseResponse(res);
  },

  async updateClient(id, body) {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(body),
    });

    return parseResponse(res);
  },

  async deleteClient(id) {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });

    return parseResponse(res);
  },

  /**
   * =======================================================
   * Destinos asignables reales del backend
   * -------------------------------------------------------
   * ADMIN    -> jefes + vendedores
   * JEFE     -> él mismo + sus vendedores
   * CARGADOR -> jefes
   * =======================================================
   */
  async listAssignableTargets() {
    const res = await fetch('/api/clients/assignable-targets', {
      headers: { ...getAuthHeaders() },
    });

    return parseResponse(res);
  },

  // =======================================================
  // SEGUIMIENTOS
  // =======================================================
  async listFollowUpsByClient(clientId) {
    const res = await fetch(`/api/seguimiento-cliente/client/${clientId}`, {
      headers: { ...getAuthHeaders() },
    });

    return parseResponse(res);
  },

  async createFollowUp(body) {
    const res = await fetch('/api/seguimiento-cliente', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(body),
    });

    return parseResponse(res);
  },

  async updateFollowUp(id, body) {
    const res = await fetch(`/api/seguimiento-cliente/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(body),
    });

    return parseResponse(res);
  },

  // =======================================================
  // USUARIOS
  // =======================================================
  async listUsers() {
    const res = await fetch('/api/users', {
      headers: { ...getAuthHeaders() },
    });

    return parseResponse(res);
  },

  async listMyVendors() {
    const res = await fetch('/api/users/my-vendors', {
      headers: { ...getAuthHeaders() },
    });

    return parseResponse(res);
  },

  async createUser(body) {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(body),
    });

    return parseResponse(res);
  },

  async updateUser(id, body) {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(body),
    });

    return parseResponse(res);
  },

  async deactivateUser(id) {
  const res = await fetch(`/api/users/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });

  return parseResponse(res);
},
};