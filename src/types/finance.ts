export type LoanType = "salary_advance" | "micro_loan" | "business_loan" | "equipment_loan";
export type LoanStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "disbursed"
  | "active"
  | "completed"
  | "defaulted";
export type RepaymentFrequency = "weekly" | "bi-weekly" | "monthly";
export type DocumentType = "income_proof" | "bank_statement" | "id_document" | "business_license" | "other";
export type DisbursementMethod = "bank_transfer" | "mobile_money" | "cash";
export type ScheduleStatus = "pending" | "paid" | "overdue" | "waived";
export type SalaryFrequency = "weekly" | "bi-weekly" | "monthly";
export type SalaryAdvanceStatus = "pending" | "approved" | "rejected" | "disbursed" | "repaid";
export type TransactionType =
  | "loan_disbursement"
  | "loan_repayment"
  | "salary_advance"
  | "payment"
  | "refund"
  | "fee";
export type TransactionDirection = "inbound" | "outbound";
export type TransactionStatus = "pending" | "completed" | "failed" | "cancelled";
export type PaymentMethod =
  | "bank_transfer"
  | "mobile_money"
  | "card"
  | "cash"
  | "paypal"
  | "paymaya";
export type TransactionCategory = "income" | "expense" | "withdrawal" | "refund" | "bonus" | "referral";
export type AccountType = "checking" | "savings";

export interface LoanAmount {
  requested: number;
  approved?: number;
  disbursed?: number;
  currency?: string;
}

export interface LoanTerm {
  duration?: number;
  interestRate?: number;
  repaymentFrequency?: RepaymentFrequency;
}

export interface ApplicationDocument {
  type?: DocumentType;
  url?: string;
  uploadedAt?: Date;
}

export interface RiskFactor {
  factor?: string;
  impact?: string;
}

export interface RiskAssessment {
  score?: number;
  factors?: RiskFactor[];
}

export interface Application {
  submittedAt?: Date;
  documents?: ApplicationDocument[];
  creditScore?: number;
  riskAssessment?: RiskAssessment;
}

export interface Approval {
  approvedBy?: string;
  approvedAt?: Date;
  conditions?: string[];
  notes?: string;
}

export interface AccountDetails {
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
}

export interface Disbursement {
  method?: DisbursementMethod;
  accountDetails?: AccountDetails;
  disbursedAt?: Date;
  transactionId?: string;
}

export interface RepaymentSchedule {
  dueDate?: Date;
  amount?: number;
  principal?: number;
  interest?: number;
  status?: ScheduleStatus;
  paidAt?: Date;
  transactionId?: string;
}

export interface Repayment {
  schedule?: RepaymentSchedule[];
  totalPaid?: number;
  remainingBalance?: number;
  nextPaymentDate?: Date;
}

export interface Partner {
  name?: string;
  apiKey?: string;
  loanId?: string;
}

export interface Loan {
  _id?: string;
  borrower?: string;
  type?: LoanType;
  amount?: LoanAmount;
  purpose?: string;
  term?: LoanTerm;
  status?: LoanStatus;
  application?: Application;
  approval?: Approval;
  disbursement?: Disbursement;
  repayment?: Repayment;
  partner?: Partner;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SalaryAdvanceAmount {
  requested?: number;
  approved?: number;
  currency?: string;
}

export interface Salary {
  monthly?: number;
  nextPayDate?: Date;
  frequency?: SalaryFrequency;
}

export interface SalaryAdvanceRepayment {
  dueDate?: Date;
  amount?: number;
  deductedFromSalary?: boolean;
  repaidAt?: Date;
}

export interface Fees {
  processingFee?: number;
  interestRate?: number;
  totalFees?: number;
}

export interface SalaryAdvance {
  _id?: string;
  employee?: string;
  employer?: string;
  amount?: SalaryAdvanceAmount;
  salary?: Salary;
  status?: SalaryAdvanceStatus;
  repayment?: SalaryAdvanceRepayment;
  fees?: Fees;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Transaction {
  _id?: string;
  user?: string;
  type?: TransactionType;
  amount?: number;
  currency?: string;
  direction?: TransactionDirection;
  description?: string;
  reference: string;
  status?: TransactionStatus;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  externalReference?: string;
  paypalOrderId?: string;
  paypalTransactionId?: string;
  paymayaReferenceNumber?: string;
  paymayaCheckoutId?: string;
  paymayaPaymentId?: string;
  paymayaInvoiceId?: string;
  paymayaTransactionId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Wallet {
  balance?: number;
  pendingBalance?: number;
  lastUpdated?: Date;
  autoWithdraw?: boolean;
  minBalance?: number;
  notificationSettings?: {
    lowBalance?: boolean;
    withdrawal?: boolean;
    payment?: boolean;
  };
}

export interface TransactionDetails {
  type?: TransactionCategory;
  amount?: number;
  category?: string;
  description?: string;
  paymentMethod?: string;
  status?: string;
  timestamp?: Date;
  reference?: string;
  accountDetails?: AccountDetails;
  adminNotes?: string;
  processedAt?: Date;
  processedBy?: string;
}

export interface Finance {
  _id?: string;
  user: string;
  wallet?: Wallet;
  transactions?: TransactionDetails[];
  createdAt?: Date;
  updatedAt?: Date;
}
