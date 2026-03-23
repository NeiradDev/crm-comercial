import { renderProtectedShell, protectRolePage } from './page-shell.js';
import { bindClientEvents, loadClients } from './clients.js';
import { bindFollowUpEvents } from './seguimientos.js';
import {
  bindUserEvents,
  bindTabEventsJefe,
} from './users.js';

async function boot() {
  protectRolePage('JEFE');
  renderProtectedShell();

  bindClientEvents();
  bindFollowUpEvents();
  bindUserEvents();

  bindTabEventsJefe({
    onShowClients: loadClients,
  });

  await loadClients();
}

boot();