import { ApiError } from "../src/common/api-error";
import { generateAmounts } from "../src/saving-plans/amount-generation";

describe("amount generation", () => {
  it("generates a classic sequence for 30 days", () => {
    const result = generateAmounts({ durationDays: 30, generationMode: "CLASSIC_SEQUENCE", unitAmount: 5000 });
    expect(result.amounts).toHaveLength(30);
    expect(result.amounts.at(-1)).toBe(150000);
    expect(result.targetAmount).toBe(2325000);
  });
  it("distributes an exact target without violating bounds", () => {
    const result = generateAmounts({ durationDays: 30, generationMode: "TARGET_AUTO_DISTRIBUTION", targetAmount: 900000, minAmount: 10000, maxAmount: 30000, stepAmount: 1000 });
    expect(result.amounts).toHaveLength(30);
    expect(result.targetAmount).toBe(900000);
    expect(result.amounts.every((amount) => amount >= 10000 && amount <= 30000 && amount % 1000 === 0)).toBe(true);
  });
  it("allows duplicate amounts in a custom list", () => {
    const customAmounts = Array.from({ length: 30 }, (_, index) => index < 2 ? 50000 : 100000);
    const result = generateAmounts({ durationDays: 30, generationMode: "CUSTOM_LIST", customAmounts });
    expect(result.amounts).toEqual(customAmounts);
  });
  it("rejects an impossible target", () => {
    expect(() => generateAmounts({ durationDays: 30, generationMode: "TARGET_AUTO_DISTRIBUTION", targetAmount: 1000000, minAmount: 50000, maxAmount: 60000, stepAmount: 1000 })).toThrow(ApiError);
  });
  it("rejects plans shorter than 30 days", () => {
    expect(() => generateAmounts({ durationDays: 29, generationMode: "CLASSIC_SEQUENCE", unitAmount: 5000 })).toThrow(ApiError);
  });
});
