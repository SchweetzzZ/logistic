export interface UserEmployee {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'OPERATOR';
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'MANAGER' | 'OPERATOR';
}

export interface UpdateEmployeeInput {
  name?: string;
  email?: string;
  password?: string;
  role?: 'ADMIN' | 'MANAGER' | 'OPERATOR';
}
