export interface Customer {
  id: string;
  name: string;
  cpf: string;
  email?: string | null;
  phone?: string | null;
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  city?: string | null;
  state?: string | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  name: string;
  cpf: string;
  email?: string | null;
  phone?: string | null;
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {}

export interface CustomerImportResult {
  totalProcessed: number;
  totalImported: number;
  errors: { row: number; error: string }[];
}
