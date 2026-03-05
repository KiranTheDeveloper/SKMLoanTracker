export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  NEW_LEAD: "New Lead",
  CONTACTED: "Contacted",
  DOCS_REQUESTED: "Docs Requested",
  DOCS_PARTIAL: "Docs Partial",
  DOCS_COMPLETE: "Docs Complete",
  PROCESSING: "Processing",
  SUBMITTED_TO_BANK: "Submitted to Bank",
  APPROVED: "Approved",
  DISBURSED: "Disbursed",
  REJECTED: "Rejected",
  ON_HOLD: "On Hold",
  DROPPED: "Dropped",
};

export const APPLICATION_STATUS_COLORS: Record<string, string> = {
  NEW_LEAD: "bg-slate-700/50 text-slate-300",
  CONTACTED: "bg-blue-900/40 text-blue-300",
  DOCS_REQUESTED: "bg-yellow-900/40 text-yellow-300",
  DOCS_PARTIAL: "bg-orange-900/40 text-orange-300",
  DOCS_COMPLETE: "bg-cyan-900/40 text-cyan-300",
  PROCESSING: "bg-purple-900/40 text-purple-300",
  SUBMITTED_TO_BANK: "bg-indigo-900/40 text-indigo-300",
  APPROVED: "bg-green-900/40 text-green-300",
  DISBURSED: "bg-emerald-900/40 text-emerald-300",
  REJECTED: "bg-red-900/40 text-red-300",
  ON_HOLD: "bg-amber-900/40 text-amber-300",
  DROPPED: "bg-gray-700/40 text-gray-400",
};

export const APPLICATION_STATUSES = [
  "NEW_LEAD",
  "CONTACTED",
  "DOCS_REQUESTED",
  "DOCS_PARTIAL",
  "DOCS_COMPLETE",
  "PROCESSING",
  "SUBMITTED_TO_BANK",
  "APPROVED",
  "DISBURSED",
  "REJECTED",
  "ON_HOLD",
  "DROPPED",
] as const;

export type ApplicationStatusType = (typeof APPLICATION_STATUSES)[number];

export const ACTIVE_STATUSES = [
  "NEW_LEAD",
  "CONTACTED",
  "DOCS_REQUESTED",
  "DOCS_PARTIAL",
  "DOCS_COMPLETE",
  "PROCESSING",
  "SUBMITTED_TO_BANK",
];

export const CLOSED_STATUSES = ["APPROVED", "DISBURSED", "REJECTED", "DROPPED"];

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-700/40 text-gray-400",
  MEDIUM: "bg-blue-900/40 text-blue-300",
  HIGH: "bg-orange-900/40 text-orange-300",
  URGENT: "bg-red-900/40 text-red-300",
};

export const DOC_TYPES = [
  // Identity
  "AADHAAR_FRONT",
  "AADHAAR_BACK",
  "PAN_CARD",
  "PASSPORT",
  "VOTER_ID",
  "DRIVING_LICENSE",
  // Address Proof
  "ADDRESS_PROOF",
  "ELECTRICITY_BILL",
  "WATER_BILL",
  "GAS_BILL",
  "TELEPHONE_BILL",
  "RENT_AGREEMENT",
  "BANK_PASSBOOK",
  // Income / Employment
  "SALARY_SLIP",
  "FORM_16",
  "ITR",
  "APPOINTMENT_LETTER",
  "OFFER_LETTER",
  "EMPLOYMENT_CERTIFICATE",
  // Bank
  "BANK_STATEMENT",
  "CHEQUE",
  // Business
  "BUSINESS_PROOF",
  "GST_CERTIFICATE",
  "UDYAM_CERTIFICATE",
  "INCORPORATION_CERTIFICATE",
  "TRADE_LICENSE",
  "PARTNERSHIP_DEED",
  "SHOP_ESTABLISHMENT",
  // Asset / Loan specific
  "PROPERTY_DOCS",
  "VEHICLE_DOCS",
  "INSURANCE_POLICY",
  "EXISTING_LOAN_STATEMENT",
  // Other
  "PHOTO",
  "OTHER",
] as const;

export const DOC_TYPE_LABELS: Record<string, string> = {
  // Identity
  AADHAAR_FRONT: "Aadhaar Card (Front)",
  AADHAAR_BACK: "Aadhaar Card (Back)",
  PAN_CARD: "PAN Card",
  PASSPORT: "Passport",
  VOTER_ID: "Voter ID (Election Card)",
  DRIVING_LICENSE: "Driving License",
  // Address Proof
  ADDRESS_PROOF: "Address Proof",
  ELECTRICITY_BILL: "Electricity Bill",
  WATER_BILL: "Water Bill",
  GAS_BILL: "Gas Bill / Connection",
  TELEPHONE_BILL: "Telephone / Mobile Bill",
  RENT_AGREEMENT: "Rent Agreement",
  BANK_PASSBOOK: "Bank Passbook (First Page)",
  // Income / Employment
  SALARY_SLIP: "Salary Slip",
  FORM_16: "Form 16",
  ITR: "Income Tax Return (ITR)",
  APPOINTMENT_LETTER: "Appointment Letter",
  OFFER_LETTER: "Offer Letter",
  EMPLOYMENT_CERTIFICATE: "Employment Certificate",
  // Bank
  BANK_STATEMENT: "Bank Statement (6 months)",
  CHEQUE: "Cancelled Cheque",
  // Business
  BUSINESS_PROOF: "Business Proof",
  GST_CERTIFICATE: "GST Registration Certificate",
  UDYAM_CERTIFICATE: "Udyam / MSME Certificate",
  INCORPORATION_CERTIFICATE: "Certificate of Incorporation",
  TRADE_LICENSE: "Trade License",
  PARTNERSHIP_DEED: "Partnership Deed",
  SHOP_ESTABLISHMENT: "Shop & Establishment Certificate",
  // Asset / Loan specific
  PROPERTY_DOCS: "Property Documents",
  VEHICLE_DOCS: "Vehicle Documents (RC)",
  INSURANCE_POLICY: "Insurance Policy",
  EXISTING_LOAN_STATEMENT: "Existing Loan Statement",
  // Other
  PHOTO: "Passport Size Photograph",
  OTHER: "Other Document",
};

export const DOC_TYPE_GROUPS: { label: string; types: string[] }[] = [
  {
    label: "Identity Proof",
    types: ["AADHAAR_FRONT", "AADHAAR_BACK", "PAN_CARD", "PASSPORT", "VOTER_ID", "DRIVING_LICENSE"],
  },
  {
    label: "Address Proof",
    types: ["ADDRESS_PROOF", "ELECTRICITY_BILL", "WATER_BILL", "GAS_BILL", "TELEPHONE_BILL", "RENT_AGREEMENT", "BANK_PASSBOOK"],
  },
  {
    label: "Income / Employment",
    types: ["SALARY_SLIP", "FORM_16", "ITR", "APPOINTMENT_LETTER", "OFFER_LETTER", "EMPLOYMENT_CERTIFICATE"],
  },
  {
    label: "Bank Documents",
    types: ["BANK_STATEMENT", "CHEQUE"],
  },
  {
    label: "Business Documents",
    types: ["BUSINESS_PROOF", "GST_CERTIFICATE", "UDYAM_CERTIFICATE", "INCORPORATION_CERTIFICATE", "TRADE_LICENSE", "PARTNERSHIP_DEED", "SHOP_ESTABLISHMENT"],
  },
  {
    label: "Asset / Collateral",
    types: ["PROPERTY_DOCS", "VEHICLE_DOCS", "INSURANCE_POLICY", "EXISTING_LOAN_STATEMENT"],
  },
  {
    label: "Other",
    types: ["PHOTO", "OTHER"],
  },
];

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Chandigarh",
  "Puducherry", "Lakshadweep", "Dadra and Nagar Haveli",
];
