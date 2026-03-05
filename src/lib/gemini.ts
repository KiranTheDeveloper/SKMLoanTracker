import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface ExtractedKYCData {
  // Document type
  docType?: string;
  // Personal identity
  name?: string;
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
  dob?: string;
  gender?: string;
  // ID numbers
  aadhaarNo?: string;
  panNo?: string;
  passportNo?: string;
  passportExpiry?: string;
  voterIdNo?: string;
  dlNo?: string;
  dlExpiry?: string;
  dlVehicleClass?: string;
  // Address
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  // Bank details
  bankName?: string;
  accountNo?: string;
  accountType?: string;
  ifscCode?: string;
  micrCode?: string;
  branchName?: string;
  accountHolderName?: string;
  openingBalance?: string;
  closingBalance?: string;
  // Employment / income
  companyName?: string;
  designation?: string;
  employeeId?: string;
  grossSalary?: string;
  netSalary?: string;
  basicSalary?: string;
  salaryMonth?: string;
  tdsDeducted?: string;
  pfDeducted?: string;
  // ITR / Form 16
  assessmentYear?: string;
  grossIncome?: string;
  taxableIncome?: string;
  taxPaid?: string;
  // Business
  gstNo?: string;
  udyamNo?: string;
  companyRegistrationNo?: string;
  businessName?: string;
  businessType?: string;
  incorporationDate?: string;
  // Utility bills
  billMonth?: string;
  billAmount?: string;
  consumerNo?: string;
  serviceProviderName?: string;
  // Property / Vehicle
  propertyAddress?: string;
  vehicleRegNo?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  chassisNo?: string;
  engineNo?: string;
  // Existing loan
  loanAccountNo?: string;
  loanAmount?: string;
  emiAmount?: string;
  outstandingBalance?: string;
  // Meta
  confidence?: string;
  notes?: string;
  [key: string]: string | undefined;
}

const EXTRACTION_PROMPT = `You are a document data extraction assistant for SKM Financial Services, an Indian financial services company.
Carefully analyze this document and extract ALL information visible in it.

Return a JSON object with ONLY the fields present/visible in the document (omit fields not found):

IDENTITY FIELDS:
- docType: one of "AADHAAR_CARD", "PAN_CARD", "PASSPORT", "VOTER_ID", "DRIVING_LICENSE", "BANK_STATEMENT", "SALARY_SLIP", "FORM_16", "ITR", "CANCELLED_CHEQUE", "BANK_PASSBOOK", "ELECTRICITY_BILL", "WATER_BILL", "GAS_BILL", "TELEPHONE_BILL", "RENT_AGREEMENT", "GST_CERTIFICATE", "UDYAM_CERTIFICATE", "INCORPORATION_CERTIFICATE", "TRADE_LICENSE", "PROPERTY_DOCS", "VEHICLE_RC", "APPOINTMENT_LETTER", "EMPLOYMENT_CERTIFICATE", "OTHER"
- name: full name of the person/entity
- fatherName: father's name (from Aadhaar, PAN, DL etc.)
- motherName: mother's name if present
- spouseName: husband/wife name if present
- dob: date of birth in DD/MM/YYYY format
- gender: "Male", "Female", or "Other"

ID NUMBERS:
- aadhaarNo: 12-digit Aadhaar number (preserve masking e.g. "XXXX XXXX 1234")
- panNo: PAN number exactly as printed (e.g. "ABCDE1234F")
- passportNo: passport number
- passportExpiry: passport expiry date
- voterIdNo: voter ID / EPIC number
- dlNo: driving license number
- dlExpiry: DL expiry date
- dlVehicleClass: vehicle class/category on DL

ADDRESS FIELDS:
- address: complete address as printed
- city: city/town/district name
- state: state name
- pincode: 6-digit PIN code

BANK FIELDS:
- bankName: full bank name (e.g. "State Bank of India")
- accountNo: bank account number
- accountType: "Savings", "Current", "OD", or "CC"
- ifscCode: IFSC code (e.g. "SBIN0001234")
- micrCode: MICR code if present
- branchName: branch name
- accountHolderName: name as on bank account
- openingBalance: opening balance if visible (number only, no ₹)
- closingBalance: closing balance if visible (number only, no ₹)

EMPLOYMENT / INCOME:
- companyName: employer / company name
- designation: job title / designation
- employeeId: employee ID / staff number
- grossSalary: gross monthly salary (number only, e.g. "45000")
- netSalary: net take-home salary (number only)
- basicSalary: basic salary component (number only)
- salaryMonth: month and year of salary slip (e.g. "March 2025")
- tdsDeducted: TDS amount (number only)
- pfDeducted: PF/EPF amount (number only)

ITR / FORM 16:
- assessmentYear: assessment year (e.g. "AY 2024-25")
- grossIncome: total gross income (number only)
- taxableIncome: net taxable income (number only)
- taxPaid: total tax paid (number only)

BUSINESS:
- gstNo: GST registration number (15-character format)
- udyamNo: Udyam / MSME registration number
- companyRegistrationNo: CIN / registration number
- businessName: name of business / firm
- businessType: Pvt Ltd / Partnership / Proprietorship / LLP etc.
- incorporationDate: date of incorporation / registration

UTILITY BILLS:
- billMonth: billing month/period
- billAmount: bill amount (number only)
- consumerNo: consumer / account number
- serviceProviderName: electricity board / telecom provider name

VEHICLE / PROPERTY:
- propertyAddress: property address from documents
- vehicleRegNo: vehicle registration number
- vehicleMake: vehicle brand (Maruti, Honda, etc.)
- vehicleModel: vehicle model name
- chassisNo: chassis number
- engineNo: engine number

EXISTING LOAN:
- loanAccountNo: loan account number
- loanAmount: sanctioned loan amount (number only)
- emiAmount: EMI amount (number only)
- outstandingBalance: outstanding balance (number only)

META:
- confidence: "HIGH" if document is clear and data certain, "MEDIUM" if some fields unclear, "LOW" if blurry/partial
- notes: important observations (e.g. "Aadhaar partially masked", "back side only", "multiple months included")

IMPORTANT RULES:
- For Aadhaar: preserve any masking (e.g. XXXX XXXX 1234); return all 12 digits if all visible
- For PAN: return exactly as printed, all caps
- For monetary amounts: return only the numeric value, no ₹ symbol or commas (e.g. "45000" not "₹45,000")
- For dates: use DD/MM/YYYY format
- Return ONLY valid JSON, no markdown, no backticks, no explanation text`;

export async function extractDocumentData(
  fileBuffer: Buffer,
  mimeType: string
): Promise<ExtractedKYCData> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent([
    {
      inlineData: {
        data: fileBuffer.toString("base64"),
        mimeType: mimeType as any,
      },
    },
    EXTRACTION_PROMPT,
  ]);

  const text = result.response.text().trim();
  // Remove markdown code fences if present
  const jsonText = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(jsonText) as ExtractedKYCData;
}
