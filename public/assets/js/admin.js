import { renderProtectedShell, protectRolePage } from './page-shell.js';
import { bindClientEvents, loadClients } from './clients.js';
import { bindFollowUpEvents } from './seguimientos.js';
import {
  bindUserEvents,
  bindTabEventsAdmin,
} from './users.js';

async function boot() {
  protectRolePage('ADMIN');
  renderProtectedShell();

  bindClientEvents();
  bindFollowUpEvents();
  bindUserEvents();

  bindTabEventsAdmin({
    onShowClients: loadClients,
  });

  await loadClients();
}

boot();