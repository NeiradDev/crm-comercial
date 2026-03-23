import { bindAuthEvents, renderAuthState } from './auth.js';
import { bindClientEvents, loadClients } from './clients.js';
import { bindFollowUpEvents } from './seguimientos.js';
import {
  bindTabEvents,
  bindUserEvents,
  configureTabsByRole,
} from './users.js';
import { isLoggedIn } from './session.js';

/**
 * =========================================================
 * Punto único de arranque
 * ---------------------------------------------------------
 * Responsabilidad:
 * - inicializar módulos
 * - restaurar sesión
 * - configurar tabs por rol
 * =========================================================
 */
async function boot() {
  renderAuthState();

  bindAuthEvents({
    onLoginSuccess: async () => {
      configureTabsByRole();
      await loadClients();
    },
    onLogout: () => {
      // reservado
    },
  });

  bindClientEvents();
  bindFollowUpEvents();
  bindUserEvents();

  bindTabEvents({
    onShowClients: loadClients,
  });

  if (isLoggedIn()) {
    configureTabsByRole();
    await loadClients();
  }
}

boot();