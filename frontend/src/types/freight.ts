export interface PackageDimensions {
  length: number;
  width: number;
  height: number;
}

export interface SimulateFreightInput {
  destinationZipCode: string;
  originZipCode?: string;
  weight: number;
  dimensions: PackageDimensions;
  declaredValue: number;
  carrierId?: string;
}

export interface LocationInfo {
  zipCode: string;
  city: string;
  state: string;
  isEstimated?: boolean;
}

export interface FreightQuoteBreakdown {
  basePrice: number;
  pricePerKg: number;
  chargedWeightKg: number;
  weightCost: number;
  distanceMultiplier: number;
  shippingSubtotal: number;
  insuranceCost: number;
}

export interface FreightQuote {
  carrierId: string;
  carrierName: string;
  deadlineDays: number;
  breakdown: FreightQuoteBreakdown;
  totalPrice: number;
}

export interface SimulationPackageInfo {
  actualWeightKg: number;
  volumetricWeightKg: number;
  chargedWeightKg: number;
  declaredValue: number;
  dimensions: PackageDimensions;
}

export interface SimulationResult {
  origin: LocationInfo;
  destination: LocationInfo;
  package: SimulationPackageInfo;
  deliveryType: 'LOCAL' | 'STATE' | 'INTERSTATE';
  quotes: FreightQuote[];
}

export interface FreightHistoryItem {
  id: string;
  tenantId: string;
  userId: string | null;
  originZipCode: string;
  destinationZipCode: string;
  originCity: string | null;
  originState: string | null;
  destinationCity: string | null;
  destinationState: string | null;
  actualWeightKg: string;
  volumetricWeightKg: string;
  chargedWeightKg: string;
  declaredValue: string;
  dimensionsLength: string;
  dimensionsWidth: string;
  dimensionsHeight: string;
  deliveryType: 'LOCAL' | 'STATE' | 'INTERSTATE';
  cheapestCarrierId: string | null;
  cheapestCarrierName: string | null;
  cheapestPrice: string | null;
  cheapestDeadlineDays: number | null;
  quotes: FreightQuote[];
  createdAt: string;
}

export interface FreightHistoryResponse {
  data: FreightHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
