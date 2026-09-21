export type AuditAction =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_ROLE_CHANGE'
  | 'USER_DELETE'
  | 'CARRIER_CREATE'
  | 'CARRIER_UPDATE'
  | 'CARRIER_DELETE'
  | 'CUSTOMER_CREATE'
  | 'CUSTOMER_UPDATE'
  | 'CUSTOMER_DELETE';

export interface AuditLogItem {
  id: string;
  tenantId?: string | null;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  action: AuditAction;
  resource: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: Record<string, any> | null;
  createdAt: string;
}

export interface AuditFilterParams {
  action?: AuditAction;
  resource?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogPaginatedResponse {
  data: AuditLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
