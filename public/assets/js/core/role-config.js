export const ROLE_CONFIG = {
  ADMIN: {
    title: 'Panel de administración',
    subtitle: 'Acceso global al sistema',
    description:
      'Acceso completo al dashboard único. Clientes, usuarios y creación de usuarios viven en la misma pantalla.',
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
      'Acceso de supervisión sobre clientes y sus vendedores. Aquí se lista my-vendors, pero no se crean usuarios.',
    tabs: [
      { key: 'clients', label: 'Clientes' },
      { key: 'users', label: 'Mis vendedores' },
    ],
    defaultTab: 'clients',
  },

  VENDEDOR: {
    title: 'Panel de vendedor',
    subtitle: 'Operación comercial',
    description:
      'Acceso operativo centrado en clientes.',
    tabs: [
      { key: 'clients', label: 'Clientes' },
    ],
    defaultTab: 'clients',
  },

  CARGADOR: {
    title: 'Panel de importación',
    subtitle: 'Carga de datos',
    description:
      'Acceso reservado para carga masiva e importación.',
    tabs: [
      { key: 'import', label: 'Importación' },
    ],
    defaultTab: 'import',
  },
};