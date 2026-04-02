// ----------------------------------------------------------
// RENDER DEL DASBOAR PRINCIPAL
// ----------------------------------------------------------
export const ROLE_CONFIG = {
  ADMIN: {
    title: 'Panel de administración',
    subtitle: 'Acceso global al sistema',
    description:
      'Acceso completo al dashboard único. Desde aquí conectamos primero clientes y luego el resto.',
    tabs: [
      { key: 'clients', label: 'Clientes' },
      { key: 'users', label: 'Usuarios' },
      { key: 'createUser', label: 'Crear usuario' },
      { key: 'import', label: 'Importación' },
    ],
    defaultTab: 'clients',
  },

  JEFE: {
    title: 'Panel de supervisor',
    subtitle: 'Supervisión de vendedores y clientes',
    description:
      'Acceso de supervisión sobre clientes y usuarios de su alcance usando el mismo dashboard único.',
    tabs: [
      { key: 'clients', label: 'Clientes' },
      { key: 'users', label: 'Usuarios' },
      { key: 'createUser', label: 'Crear usuario' },
    ],
    defaultTab: 'clients',
  },

  VENDEDOR: {
    title: 'Panel de vendedor',
    subtitle: 'Operación comercial',
    description:
      'Acceso operativo centrado en clientes. Desde aquí luego seguiremos con seguimientos.',
    tabs: [
      { key: 'clients', label: 'Clientes' },
    ],
    defaultTab: 'clients',
  },

  CARGADOR: {
    title: 'Panel de importación',
    subtitle: 'Carga de datos',
    description:
      'Acceso reservado para carga masiva e importación. No debe ver módulos operativos innecesarios.',
    tabs: [
      { key: 'import', label: 'Importación' },
    ],
    defaultTab: 'import',
  },
};