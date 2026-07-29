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
    const result = generateAmounts({ durationDays: 5, generationMode: "TARGET_AUTO_DISTRIBUTION", targetAmount: 100000, minAmount: 10000, maxAmount: 30000, stepAmount: 1000 });
    expect(result.amounts).toHaveLength(5);
    expect(result.targetAmount).toBe(100000);
    expect(result.amounts.every((amount) => amount >= 10000 && amount <= 30000 && amount % 1000 === 0)).toBe(true);
  });
  it("allows duplicate amounts in a custom list", () => {
    const result = generateAmounts({ durationDays: 3, generationMode: "CUSTOM_LIST", customAmounts: [50000, 50000, 100000] });
    expect(result.amounts).toEqual([50000, 50000, 100000]);
  });
  it("rejects an impossible target", () => {
    expect(() => generateAmounts({ durationDays: 3, generationMode: "TARGET_AUTO_DISTRIBUTION", targetAmount: 100000, minAmount: 50000, maxAmount: 60000, stepAmount: 1000 })).toThrow(ApiError);
  });
});
