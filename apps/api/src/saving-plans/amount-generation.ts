import { ApiError } from "../common/api-error";
import type { AmountGenerationMode } from "@saving/shared";

export interface AmountGenerationInput {
  durationDays: number;
  generationMode: AmountGenerationMode;
  unitAmount?: number;
  targetAmount?: number;
  minAmount?: number;
  maxAmount?: number;
  stepAmount?: number;
  customAmounts?: number[];
}

export interface GeneratedAmounts {
  amounts: number[];
  targetAmount: number;
  minAmount: number;
  maxAmount: number;
  averageAmount: number;
}

function positiveInteger(value: number | undefined, field: string): number {
  if (!Number.isInteger(value) || value === undefined || value <= 0) throw new ApiError("PLAN_TARGET_INVALID", `${field} phải là số nguyên dương.`);
  return value;
}

function duration(value: number): number {
  if (!Number.isInteger(value) || value < 30 || value > 300) throw new ApiError("PLAN_DURATION_INVALID", "Số ngày phải nằm trong khoảng từ 30 đến 300.");
  return value;
}

export function generateAmounts(input: AmountGenerationInput): GeneratedAmounts {
  const days = duration(input.durationDays);
  if (input.generationMode === "CLASSIC_SEQUENCE") {
    const unit = positiveInteger(input.unitAmount, "Đơn vị tiền");
    const amounts = Array.from({ length: days }, (_, index) => (index + 1) * unit);
    return summarize(amounts);
  }
  if (input.generationMode === "CUSTOM_LIST") {
    const amounts = input.customAmounts ?? [];
    if (amounts.length !== days) throw new ApiError("PLAN_TARGET_INVALID", "Số lượng khoản tiền phải bằng số ngày.");
    if (amounts.some((amount) => !Number.isInteger(amount) || amount <= 0)) throw new ApiError("PLAN_TARGET_INVALID", "Mỗi khoản tiền phải là số nguyên dương.");
    return summarize(amounts);
  }

  const target = positiveInteger(input.targetAmount, "Mục tiêu");
  const min = positiveInteger(input.minAmount, "Khoản thấp nhất");
  const max = positiveInteger(input.maxAmount, "Khoản cao nhất");
  const step = positiveInteger(input.stepAmount, "Bước làm tròn");
  if (min > max || min % step !== 0 || max % step !== 0 || target % step !== 0 || days * min > target || target > days * max) {
    throw new ApiError("PLAN_DISTRIBUTION_IMPOSSIBLE", "Không thể phân bổ mục tiêu theo giới hạn hiện tại.");
  }
  let remainingUnits = (target - days * min) / step;
  const capacityUnits = (max - min) / step;
  const amounts = Array.from({ length: days }, () => {
    const units = Math.min(capacityUnits, remainingUnits);
    remainingUnits -= units;
    return min + units * step;
  });
  if (remainingUnits !== 0) throw new ApiError("PLAN_DISTRIBUTION_IMPOSSIBLE", "Không thể phân bổ mục tiêu theo giới hạn hiện tại.");
  return summarize(amounts);
}

function summarize(amounts: number[]): GeneratedAmounts {
  const targetAmount = amounts.reduce((total, amount) => total + amount, 0);
  return { amounts, targetAmount, minAmount: Math.min(...amounts), maxAmount: Math.max(...amounts), averageAmount: Math.round(targetAmount / amounts.length) };
}
