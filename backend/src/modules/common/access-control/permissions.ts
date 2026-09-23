import { Role } from '../enums/role.enum';

export const PERMISSIONS = {
  carriers: {
    read: 'carriers:read',
    create: 'carriers:create',
    update: 'carriers:update',
    delete: 'carriers:delete',
  },
  customers: {
    read: 'customers:read',
    create: 'customers:create',
    update: 'customers:update',
    delete: 'customers:delete',
    import: 'customers:import',
    export: 'customers:export',
  },
  freight: {
    simulate: 'freight:simulate',
    read: 'freight:read',
    export: 'freight:export',
  },
  reports: {
    read: 'reports:read',
    generate: 'reports:generate',
    export: 'reports:export',
  },
  users: {
    read: 'users:read',
    create: 'users:create',
    update: 'users:update',
    delete: 'users:delete',
  },
  tenants: {
    read: 'tenants:read',
    update: 'tenants:update',
  },
  audit: {
    read: 'audit:read',
  },
  // Uppercase aliases for developer convenience
  CARRIERS: {
    READ: 'carriers:read',
    CREATE: 'carriers:create',
    UPDATE: 'carriers:update',
    DELETE: 'carriers:delete',
  },
  CUSTOMERS: {
    READ: 'customers:read',
    CREATE: 'customers:create',
    UPDATE: 'customers:update',
    DELETE: 'customers:delete',
    IMPORT: 'customers:import',
    EXPORT: 'customers:export',
  },
  FREIGHT: {
    SIMULATE: 'freight:simulate',
    READ: 'freight:read',
    EXPORT: 'freight:export',
  },
  REPORTS: {
    READ: 'reports:read',
    GENERATE: 'reports:generate',
    EXPORT: 'reports:export',
  },
  USERS: {
    READ: 'users:read',
    CREATE: 'users:create',
    UPDATE: 'users:update',
    DELETE: 'users:delete',
  },
  TENANTS: {
    READ: 'tenants:read',
    UPDATE: 'tenants:update',
  },
  AUDIT: {
    READ: 'audit:read',
  },
} as const;

export type PermissionKey =
  | 'carriers:read'
  | 'carriers:create'
  | 'carriers:update'
  | 'carriers:delete'
  | 'customers:read'
  | 'customers:create'
  | 'customers:update'
  | 'customers:delete'
  | 'customers:import'
  | 'customers:export'
  | 'freight:simulate'
  | 'freight:read'
  | 'freight:export'
  | 'reports:read'
  | 'reports:generate'
  | 'reports:export'
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  | 'tenants:read'
  | 'tenants:update'
  | 'audit:read';

export const ROLE_PERMISSIONS: Record<Role, readonly PermissionKey[]> = {
  [Role.ADMIN]: [
    PERMISSIONS.carriers.read,
    PERMISSIONS.carriers.create,
    PERMISSIONS.carriers.update,
    PERMISSIONS.carriers.delete,
    PERMISSIONS.customers.read,
    PERMISSIONS.customers.create,
    PERMISSIONS.customers.update,
    PERMISSIONS.customers.delete,
    PERMISSIONS.customers.import,
    PERMISSIONS.customers.export,
    PERMISSIONS.freight.simulate,
    PERMISSIONS.freight.read,
    PERMISSIONS.freight.export,
    PERMISSIONS.reports.read,
    PERMISSIONS.reports.generate,
    PERMISSIONS.reports.export,
    PERMISSIONS.users.read,
    PERMISSIONS.users.create,
    PERMISSIONS.users.update,
    PERMISSIONS.users.delete,
    PERMISSIONS.tenants.read,
    PERMISSIONS.tenants.update,
    PERMISSIONS.audit.read,
  ],
  [Role.MANAGER]: [
    PERMISSIONS.carriers.read,
    PERMISSIONS.carriers.create,
    PERMISSIONS.carriers.update,
    PERMISSIONS.carriers.delete,
    PERMISSIONS.customers.read,
    PERMISSIONS.customers.create,
    PERMISSIONS.customers.update,
    PERMISSIONS.customers.delete,
    PERMISSIONS.customers.import,
    PERMISSIONS.customers.export,
    PERMISSIONS.freight.simulate,
    PERMISSIONS.freight.read,
    PERMISSIONS.freight.export,
    PERMISSIONS.reports.read,
    PERMISSIONS.reports.generate,
    PERMISSIONS.reports.export,
    PERMISSIONS.users.read,
    PERMISSIONS.tenants.read,
    PERMISSIONS.audit.read,
  ],
  [Role.OPERATOR]: [
    PERMISSIONS.carriers.read,
    PERMISSIONS.customers.read,
    PERMISSIONS.customers.create,
    PERMISSIONS.customers.update,
    PERMISSIONS.customers.import,
    PERMISSIONS.customers.export,
    PERMISSIONS.freight.simulate,
    PERMISSIONS.freight.read,
    PERMISSIONS.freight.export,
    PERMISSIONS.reports.read,
    PERMISSIONS.reports.generate,
    PERMISSIONS.reports.export,
    PERMISSIONS.tenants.read,
  ],
};

export function getPermissionsForRole(
  role: Role | string,
): readonly PermissionKey[] {
  if (!role) {
    return [];
  }
  const upperRole = String(role).toUpperCase() as Role;
  if (upperRole in ROLE_PERMISSIONS) {
    return ROLE_PERMISSIONS[upperRole];
  }
  return [];
}

export function checkRolePermission(
  role: Role | string,
  required: PermissionKey,
): boolean {
  const permissions = getPermissionsForRole(role);
  return permissions.includes(required);
}
