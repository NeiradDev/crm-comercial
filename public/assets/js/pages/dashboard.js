import { protectRolePage, renderProtectedShell } from '../core/page-guard.js';
import { clearSession, getSession } from '../core/session.js';
import { ROLE_CONFIG } from '../core/role-config.js';
import { bindClientEvents, loadClients } from '../modules/clients.js';
import { bindFollowUpEvents } from '../modules/followups.js';

const body = document.body;

const roleBadge = document.getElementById('roleBadge');
const sessionUserText = document.getElementById('sessionUserText');
const panelTitle = document.getElementById('panelTitle');
const panelSubtitle = document.getElementById('panelSubtitle');
const panelDescription = document.getElementById('panelDescription');
const entryPageText = document.getElementById('entryPageText');
const requiredRoleText = document.getElementById('requiredRoleText');
const sessionStateText = document.getElementById('sessionStateText');
const dashboardTabs = document.getElementById('dashboardTabs');
const logoutBtn = document.getElementById('logoutBtn');

const clientsSection = document.getElementById('clientsSection');
const usersSection = document.getElementById('usersSection');
const createUserSection = document.getElementById('createUserSection');
const importSection = document.getElementById('importSection');

const requiredRole = String(body?.dataset?.requiredRole || '').trim().toUpperCase();
const entryPage = String(body?.dataset?.entryPage || '').trim().toLowerCase();

function setText(element, value) {
  if (!element) return;
  element.textContent = value;
}

function hideAllSections() {
  [clientsSection, usersSection, createUserSection, importSection].forEach((section) => {
    if (section) {
      section.classList.add('hidden');
    }
  });
}

function getSectionMap() {
  return {
    clients: clientsSection,
    users: usersSection,
    createUser: createUserSection,
    import: importSection,
  };
}

async function onTabActivated(tabKey) {
  hideAllSections();

  const map = getSectionMap();
  const target = map[tabKey];

  if (target) {
    target.classList.remove('hidden');
  }

  document.querySelectorAll('.dashboard-tab').forEach((button) => {
    const isActive = button.dataset.tab === tabKey;
    button.classList.toggle('is-active', isActive);
  });

  if (tabKey === 'clients') {
    await loadClients();
  }
}

function renderTabs(config) {
  if (!dashboardTabs) return;

  dashboardTabs.innerHTML = '';

  config.tabs.forEach((tab) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dashboard-tab';
    button.dataset.tab = tab.key;
    button.textContent = tab.label;

    button.addEventListener('click', async () => {
      await onTabActivated(tab.key);
    });

    dashboardTabs.appendChild(button);
  });
}

async function activateDefaultTab(config) {
  await onTabActivated(config.defaultTab);
}

function renderShell(session) {
  const currentRole = session.role || 'SIN ROL';
  const currentEmail = session.userEmail || 'Sin correo';
  const config = ROLE_CONFIG[currentRole];

  setText(roleBadge, currentRole);
  setText(sessionUserText, currentEmail);
  setText(entryPageText, entryPage || '-');
  setText(requiredRoleText, requiredRole || '-');
  setText(sessionStateText, 'Autorizado');

  if (!config) {
    setText(panelTitle, 'Rol sin configuración');
    setText(panelSubtitle, 'Dashboard único');
    setText(
      panelDescription,
      'Tu sesión es válida, pero este rol todavía no tiene configuración visual en el dashboard.',
    );
    hideAllSections();

    if (dashboardTabs) {
      dashboardTabs.innerHTML = '';
    }

    return null;
  }

  setText(panelTitle, config.title);
  setText(panelSubtitle, config.subtitle);
  setText(panelDescription, config.description);

  renderTabs(config);
  return config;
}

function bindLogout() {
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', () => {
    clearSession();
    window.location.href = '/login';
  });
}

async function boot() {
  const allowed = protectRolePage(requiredRole);

  if (!allowed) {
    return;
  }

  renderProtectedShell();

  const session = getSession();

  bindClientEvents();
  bindFollowUpEvents();

  const config = renderShell(session);
  bindLogout();

  if (config) {
    await activateDefaultTab(config);
  }
}

boot();