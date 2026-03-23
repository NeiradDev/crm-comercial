import { renderProtectedShell, protectRolePage } from './page-shell.js';
import { bindClientEvents, loadClients } from './clients.js';
import { bindFollowUpEvents } from './seguimientos.js';

async function boot() {
  protectRolePage('VENDEDOR');
  renderProtectedShell();

  bindClientEvents();
  bindFollowUpEvents();

  await loadClients();
}

boot();