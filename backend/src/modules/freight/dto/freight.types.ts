export interface LocationInfo {
  zipCode: string;
  city: string;
  state: string;
  isEstimated?: boolean;
}

export interface FreightQuote {
  carrierId: string;
  carrierName: string;
  deadlineDays: number;
  breakdown: {
    basePrice: number;
    pricePerKg: number;
    chargedWeightKg: number;
    weightCost: number;
    distanceMultiplier: number;
    shippingSubtotal: number;
    insuranceCost: number;
  };
  totalPrice: number;
}

export interface SimulationResult {
  origin: LocationInfo;
  destination: LocationInfo;
  package: {
    actualWeightKg: number;
    volumetricWeightKg: number;
    chargedWeightKg: number;
    declaredValue: number;
    dimensions: { length: number; width: number; height: number };
  };
  deliveryType: 'LOCAL' | 'STATE' | 'INTERSTATE';
  quotes: FreightQuote[];
}
