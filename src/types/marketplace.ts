/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'vendor' | 'retailer';
export type UserStatus = 'active' | 'suspended';

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  businessName: string;
  phone: string;
  isVerified: boolean;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  state: string;
  gstin?: string;
  fssaiNumber?: string;
}

export interface BankDetails {
  accountNo: string;
  ifsc: string;
  bankName: string;
  beneficiaryName: string;
}

export interface DispatchAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Vendor {
  vendorId: string;
  legalName: string;
  tradeName: string;
  gstin: string;
  fssaiNumber: string;
  fssaiExpiry: string;
  bankDetails: BankDetails;
  dispatchAddress: DispatchAddress;
  monthlyCapacityKg: number;
  returnPolicyDays: number;
  rating: number;
  totalOrders: number;
  commissionTierId: string;
}

export type SpiceType = 'whole' | 'ground' | 'blend';
export type ProductStatus = 'draft' | 'pending_approval' | 'active' | 'delisted';

export interface PriceTier {
  minQty: number;
  maxQty: number;
  unitPrice: number;
}

export interface QualitySpecs {
  moisturePercent?: number;
  volatileOilPercent?: number;
  foreignMatterPercent?: number;
  totalAshPercent?: number;
  activeBioactivePercent?: number; // Curcumin (Turmeric) / Piperine (Black Pepper) / Capsaicin (Chilli)
  agmarkGrade?: 'Special Grade' | 'Grade I' | 'Grade II' | 'Standard';
  fssaiCompliant?: boolean;
  labCertificateNo?: string;
}

export interface Product {
  productId: string;
  vendorId: string;
  vendorBusinessName: string;
  title: string;
  category: string; // e.g. Turmeric, Cumin, Chilli, Coriander, Cardamom, Black Pepper
  spiceType: SpiceType;
  originState: string;
  originMandi?: string;
  hsnCode: string;
  gstRate: number; // 5% default for spices
  unitOfMeasure: 'kg' | 'pack';
  basePricePerUnit: number; // in INR
  moq: number; // Minimum Order Quantity in kg
  availableStock: number;
  priceTiers: PriceTier[];
  privateLabelAvailable: boolean;
  status: ProductStatus;
  images: string[];
  description?: string;
  meshGranuleSize?: string;
  culinaryUses?: string[];
  industrialUses?: string[];
  searchTags?: string[];
  qualitySpecs?: QualitySpecs;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  category: string;
  hsnCode: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  gstAmount: number;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type FulfillmentStatus = 'placed' | 'confirmed' | 'processing' | 'dispatched' | 'delivered' | 'cancelled';
export type DisputeStatus = 'open' | 'resolved' | null;

export interface ShippingDetails {
  provider: string;
  trackingNumber: string;
  dispatchedAt?: string;
  estimatedDelivery?: string;
}

export interface Order {
  orderId: string;
  parentOrderId?: string;
  retailerId: string;
  retailerBusinessName: string;
  retailerGstin: string;
  retailerState: string;
  vendorId: string;
  vendorBusinessName: string;
  vendorGstin: string;
  vendorState: string;
  items: OrderItem[];
  subtotal: number;
  gstTotal: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  isInterState: boolean;
  shippingCharges: number;
  platformCommissionAmount: number;
  platformCommissionRate: number;
  grandTotal: number;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  shippingDetails?: ShippingDetails;
  disputeStatus: DisputeStatus;
  createdAt: string;
}

export interface VendorQuotation {
  vendorId: string;
  vendorName: string;
  quotePPU: number;
  minBatchKg: number;
  leadTimeDays: number;
  notes: string;
  submittedAt: string;
}

export type RfqStatus = 'submitted' | 'under_review' | 'quoted' | 'accepted' | 'in_production' | 'completed';

export interface PrivateLabelRfq {
  rfqId: string;
  retailerId: string;
  retailerBusinessName: string;
  spiceCategory: string;
  targetQuantityKg: number;
  packagingType: string;
  targetPPU: number;
  artworkUrl?: string;
  status: RfqStatus;
  deliveryCity: string;
  notes?: string;
  vendorQuotations: VendorQuotation[];
  createdAt: string;
}

export interface Settlement {
  settlementId: string;
  vendorId: string;
  vendorBusinessName: string;
  orderId: string;
  grossAmount: number;
  commissionDeducted: number;
  tdsDeducted: number; // 1% Section 194-O
  netPayable: number;
  status: 'pending' | 'processed' | 'on_hold';
  payoutReference?: string;
  settledAt?: string;
}

export type DisputeCategory = 'Transit Damage' | 'Quality Inconsistency' | 'Short Shipment' | 'Counterfeit/Adulteration' | 'Delayed Dispatch';

export interface Dispute {
  disputeId: string;
  orderId: string;
  reportedBy: string;
  reportedByName: string;
  vendorId: string;
  vendorBusinessName: string;
  reasonCategory: DisputeCategory;
  description: string;
  evidenceUrls: string[];
  claimAmount: number;
  adminResolutionNotes?: string;
  resolutionType?: 'Full Refund' | 'Partial Compensation' | 'Replacement Goods' | 'Vendor Favor Dismissal';
  refundAmount?: number;
  resolvedAt?: string;
  status: 'open' | 'under_review' | 'resolved';
  createdAt: string;
  aiTriageResult?: AiDisputeTriageResult;
}

export interface MandiBenchmark {
  mandiId: string;
  mandiName: string;
  state: string;
  spiceCategory: string;
  variety: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number; // Benchmark spot rate per kg
  unit: string;
  arrivalVolumeQuintals: number;
  trend: 'up' | 'down' | 'steady';
  percentChange: number;
  lastUpdated: string;
}

// AI Capability Response Types
export interface AiCatalogSeoResult {
  title: string;
  category: string;
  spiceType: SpiceType;
  description: string;
  moistureRange: string;
  meshGranuleSize: string;
  culinaryUses: string[];
  industrialUses: string[];
  searchTags: string[];
  recommendedHsn: string;
  agmarkGradeSuggested: string;
  suggestedMoqKg: number;
}

export interface QualityDiscrepancy {
  parameter: string;
  providedValue: string | number;
  standardBenchmark: string;
  status: 'compliant' | 'warning' | 'rejected';
  severity: 'low' | 'medium' | 'high';
  explanation: string;
}

export interface AiQualityReport {
  overallStatus: 'compliant' | 'warning' | 'rejected';
  spiceStandardName: string;
  governingBody: string;
  parametersEvaluated: QualityDiscrepancy[];
  approvalRecommendation: string;
  suggestedRemediation?: string;
}

export interface AiMultilingualFilterResult {
  detectedLanguage: string;
  englishTranslation: string;
  intentSummary: string;
  filters: {
    category?: string;
    spiceType?: SpiceType | 'all';
    minMoqKg?: number;
    originMandi?: string;
    originState?: string;
    maxPricePerKg?: number;
    searchKeywords?: string[];
  };
}

export interface AiRfqEstimationResult {
  indicativePricePerKgRange: {
    min: number;
    max: number;
    average: number;
  };
  packagingCostPerUnit: number;
  estimatedLeadTimeDays: {
    production: number;
    printing: number;
    dispatch: number;
    totalDays: number;
  };
  volumeBreakDiscounts: Array<{
    tierKg: number;
    estimatedPricePerKg: number;
    savingsPercent: number;
  }>;
  technicalConsiderations: string[];
  suggestedVendorCriteria: string[];
}

export interface AiDisputeTriageResult {
  disputeCategory: DisputeCategory;
  sentimentScore: 'Aggressive' | 'Frustrated' | 'Constructive' | 'Neutral';
  liabilityAssessment: 'Vendor' | 'Logistics Partner' | 'Retailer' | 'Split Shared';
  confidenceScore: number;
  summaryAnalysis: string;
  suggestedMediationActions: Array<{
    action: string;
    impact: string;
    recommendedRefundPercentage: number;
  }>;
  draftResolutionNotice: string;
}
