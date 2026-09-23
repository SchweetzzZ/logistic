export interface Carrier {
  id: string;
  tenantId: string;
  name: string;
  document: string;
  email?: string | null;
  phone?: string | null;
  basePrice: string;
  pricePerKg: string;
  deadlineDays: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface CreateCarrierInput {
  name: string;
  document: string;
  email?: string | null;
  phone?: string | null;
  basePrice: number;
  pricePerKg: number;
  deadlineDays: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateCarrierInput extends Partial<CreateCarrierInput> {}

export interface CarrierImportResult {
  totalProcessed: number;
  totalImported: number;
  errors: { row: number; error: string }[];
}
