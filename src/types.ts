export interface LiftModel {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  capacityKg: number;
  platformSize: string;
  powerRequired: string;
  basePriceUSD: number;
  features: string[];
  featuresFr: string[];
  installationTimeHours: number;
  manufacturerUrl?: string;
}

export interface BusModel {
  id: string;
  name: string;
  maker: string;
  type: string;
  doorWidthMm: number;
  floorHeightMm: number;
  voltage: string;
  doorPositionRecommended: string;
  bestLiftId: string;
}

export interface LogisticsSettings {
  exchangeRateUSD_DZD: number;
  seaFreightPerUnitUSD: number;
  customsDutyPercent: number;
  vatPercent: number;
  customsPortAgencyFlatDZD: number;
  localTransportDZD: number;
  marginPercent: number;
  customExempt: boolean;
}

export interface CalculationResult {
  baseUSD: number;
  freightUSD: number;
  exchangeRate: number;
  baseCostDZD: number;
  customsDutyDZD: number;
  vatValueDZD: number;
  transitFlatDZD: number;
  transportToTlemcenDZD: number;
  totalCostPriceDZD: number;
  marginRate: number;
  profitAmountDZD: number;
  sellingPriceDZD: number;
  isDutyExempt: boolean;
}

export interface Inquiry {
  id: string;
  date: string;
  clientName: string;
  clientType: "ETUB Tlemcen (Public)" | "Ligne Privée Suburbaine" | "Association" | "Autre";
  busModel: string;
  selectedLift: string;
  quantity: number;
  routeDescription: string;
  priceBreakdown?: CalculationResult;
  status: string;
}
