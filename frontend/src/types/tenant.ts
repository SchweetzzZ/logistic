export interface Tenant {
  id: string;
  name: string;
  document: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTenantInput {
  name?: string;
  document?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}
