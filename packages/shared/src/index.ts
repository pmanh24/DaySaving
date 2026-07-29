export type ChallengeStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";
export type CellStatus = "AVAILABLE" | "COMPLETED" | "REVERSED";
export type SelectionMode = "FREE" | "RANDOM" | "ASCENDING" | "DESCENDING";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
}

export interface ChallengeSummary {
  id: string;
  name: string;
  savedAmount: number;
  targetAmount: number;
  completedCells: number;
  totalCells: number;
  progressPercent: number;
  remainingAmount: number;
  status: ChallengeStatus;
  streak: number;
}

export interface BoardCell {
  number: number;
  amount: number;
  status: CellStatus;
  completedDate: string | null;
}

export interface BoardResponse {
  challenge: ChallengeSummary;
  cells: BoardCell[];
  today: { localDate: string; checked: boolean; checkin: Checkin | null };
}

export interface Checkin {
  id: string;
  number: number;
  amount: number;
  localDate: string;
  status: "COMPLETED" | "REVERSED";
  createdAt: string;
  reversedAt?: string | null;
}

export type AmountGenerationMode = "CLASSIC_SEQUENCE" | "TARGET_AUTO_DISTRIBUTION" | "CUSTOM_LIST";
export type ProgressMode = "FLEXIBLE_CONTRIBUTION_DAYS" | "CALENDAR_DAYS";
export type SavingConfirmationMode = "PAYOS_ONLY" | "PAYOS_OR_MANUAL";
export type PaymentDestinationMode = "SINGLE_OWNER_CHANNEL" | "PLATFORM_CHANNEL";
export type SavingPlanStatus = "DRAFT" | "SCHEDULED" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
export type SavingSlotStatus = "AVAILABLE" | "RESERVED" | "PAID" | "MANUALLY_COMPLETED";
export type PaymentStatus = "CREATING" | "PENDING" | "PROCESSING" | "PAID" | "CANCELLED" | "EXPIRED" | "FAILED";

export interface SavingPlan {
  id: string;
  userId: string;
  name: string;
  durationDays: number;
  currentDayIndex: number;
  completedDays: number;
  generationMode: AmountGenerationMode;
  targetAmount: number;
  totalSavedAmount: number;
  remainingAmount: number;
  unitAmount: number | null;
  minAmount: number | null;
  maxAmount: number | null;
  stepAmount: number | null;
  progressMode: ProgressMode;
  confirmationMode: SavingConfirmationMode;
  paymentDestinationMode: PaymentDestinationMode;
  paymentExpiresInMinutes: number;
  timezone: string;
  startDate: string;
  status: SavingPlanStatus;
  createdAt: string;
  activatedAt: string | null;
  completedAt: string | null;
}

export interface SavingSlot {
  id: string;
  userId: string;
  planId: string;
  slotIndex: number;
  amount: number;
  status: SavingSlotStatus;
  reservedByPaymentId: string | null;
  reservationExpiresAt: string | null;
  assignedDayIndex: number | null;
  paidPaymentId: string | null;
  completedAt: string | null;
}

export interface SavingPayment {
  id: string;
  userId: string;
  planId: string;
  slotId: string;
  dayIndex: number;
  provider: "PAYOS";
  orderCode: number;
  paymentLinkId: string | null;
  amount: number;
  currency: "VND";
  description: string;
  checkoutUrl: string | null;
  qrCode: string | null;
  status: PaymentStatus;
  idempotencyKey: string;
  expiresAt: string;
  paidAt: string | null;
  cancelledAt: string | null;
  lastReconciledAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface SavingDayRecord {
  id: string;
  planId: string;
  slotId: string;
  paymentId: string | null;
  dayIndex: number;
  amount: number;
  confirmationSource: "PAYOS" | "MANUAL";
  status: "COMPLETED" | "REVERSED";
  localCompletedDate: string;
  completedAt: string;
}

export interface SavingPlanTodayResponse {
  plan: SavingPlan;
  currentDayIndex: number;
  pendingPayment: SavingPayment | null;
  availableSlotCount: number;
  paidSlotCount: number;
  reservedSlotCount: number;
}
