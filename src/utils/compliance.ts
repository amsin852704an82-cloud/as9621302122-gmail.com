/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// HSN Directory for Spices (Chapter 09 of Indian Customs & GST Tariff)
export const SPICE_HSN_DIRECTORY: Record<string, { code: string; description: string; defaultGSTRate: number }> = {
  'Pepper': { code: '090411', description: 'Pepper of the genus Piper: Neither crushed nor ground (Black / White)', defaultGSTRate: 5 },
  'Chilli': { code: '090421', description: 'Fruits of the genus Capsicum or Pimenta: Dried, neither crushed nor ground', defaultGSTRate: 5 },
  'Vanilla': { code: '090500', description: 'Vanilla beans whole/ground', defaultGSTRate: 5 },
  'Cinnamon': { code: '090611', description: 'Cinnamon (Cinnamomum zeylanicum Blume) neither crushed nor ground', defaultGSTRate: 5 },
  'Clove': { code: '090710', description: 'Cloves (whole fruit, cloves and stems)', defaultGSTRate: 5 },
  'Cardamom': { code: '090831', description: 'Cardamoms: Neither crushed nor ground (Alleppey Green / Malabar)', defaultGSTRate: 5 },
  'Coriander': { code: '090921', description: 'Coriander seeds: Neither crushed nor ground (Badami / Eagle)', defaultGSTRate: 5 },
  'Cumin': { code: '090931', description: 'Cumin seeds: Neither crushed nor ground (Unjha Machine Clean)', defaultGSTRate: 5 },
  'Fennel': { code: '090961', description: 'Fennel seeds: Neither crushed nor ground (Saunf)', defaultGSTRate: 5 },
  'Turmeric': { code: '091030', description: 'Turmeric (Curcuma): Salem / Nizamabad / Erode finger & bulb', defaultGSTRate: 5 },
  'Ginger': { code: '091011', description: 'Ginger: Neither crushed nor ground (Dry / Cochin)', defaultGSTRate: 5 },
  'Spice Blend': { code: '091091', description: 'Mixtures referred to in Note 1(b) to this Chapter (Garam / Curry Masala)', defaultGSTRate: 5 },
};

// Indian States and GST State Code mapping
export const INDIAN_STATES: Record<string, string> = {
  'Gujarat': '24',
  'Andhra Pradesh': '37',
  'Tamil Nadu': '33',
  'Karnataka': '29',
  'Kerala': '32',
  'Rajasthan': '08',
  'Maharashtra': '27',
  'Madhya Pradesh': '23',
  'Delhi': '07',
  'Uttar Pradesh': '09',
  'Telangana': '36',
  'Punjab': '03',
  'West Bengal': '19',
};

// Calculate GST (CGST+SGST vs IGST)
export interface GstCalculationResult {
  isInterState: boolean;
  taxableAmount: number;
  gstRate: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalGst: number;
  grandTotal: number;
}

export function calculateSpiceGst(
  taxableAmount: number,
  vendorState: string,
  retailerState: string,
  gstRate: number = 5
): GstCalculationResult {
  const isInterState = vendorState.trim().toLowerCase() !== retailerState.trim().toLowerCase();
  
  if (isInterState) {
    const igstAmount = Math.round((taxableAmount * gstRate) / 100 * 100) / 100;
    return {
      isInterState: true,
      taxableAmount,
      gstRate,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: gstRate,
      igstAmount,
      totalGst: igstAmount,
      grandTotal: Math.round((taxableAmount + igstAmount) * 100) / 100,
    };
  } else {
    const halfRate = gstRate / 2;
    const cgstAmount = Math.round((taxableAmount * halfRate) / 100 * 100) / 100;
    const sgstAmount = Math.round((taxableAmount * halfRate) / 100 * 100) / 100;
    const totalGst = Math.round((cgstAmount + sgstAmount) * 100) / 100;
    return {
      isInterState: false,
      taxableAmount,
      gstRate,
      cgstRate: halfRate,
      cgstAmount,
      sgstRate: halfRate,
      sgstAmount,
      igstRate: 0,
      igstAmount: 0,
      totalGst,
      grandTotal: Math.round((taxableAmount + totalGst) * 100) / 100,
    };
  }
}

// 14-digit FSSAI Validator
export interface FssaiValidationResult {
  isValid: boolean;
  message: string;
  type?: 'Central License' | 'State License' | 'Basic Registration';
  stateCode?: string;
  yearOfEnrollment?: string;
}

export function validateFSSAI(fssaiNumber: string): FssaiValidationResult {
  const cleaned = fssaiNumber.replace(/\s+/g, '');
  if (!cleaned) {
    return { isValid: false, message: 'FSSAI License number is required' };
  }
  if (!/^\d{14}$/.test(cleaned)) {
    return {
      isValid: false,
      message: `FSSAI number must be exactly 14 numeric digits (currently ${cleaned.length} digits)`,
    };
  }

  const firstDigit = cleaned.charAt(0);
  let type: 'Central License' | 'State License' | 'Basic Registration' = 'State License';
  if (firstDigit === '1') {
    type = 'State License';
  } else if (firstDigit === '2') {
    type = 'Basic Registration';
  } else {
    type = 'Central License';
  }

  const stateCode = cleaned.substring(1, 3);
  const yearOfEnrollment = '20' + cleaned.substring(3, 5);

  return {
    isValid: true,
    message: `Valid 14-digit FSSAI (${type}, State ${stateCode}, Enrolled ${yearOfEnrollment})`,
    type,
    stateCode,
    yearOfEnrollment,
  };
}

// Format Currency in Indian Rupees format (₹ xx,xx,xxx.xx)
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

// Format weight in KGs or Metric Tonnes
export function formatWeight(kg: number): string {
  if (kg >= 1000) {
    const tonnes = (kg / 1000).toFixed(2);
    return `${tonnes} MT (${kg.toLocaleString('en-IN')} kg)`;
  }
  return `${kg.toLocaleString('en-IN')} kg`;
}
