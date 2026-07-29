import { ChallengesService } from "../src/challenges/challenges.service";

describe("ChallengesService", () => {
  it("calculates an amount from the cell number", () => {
    const service = new ChallengesService();
    const board = service.checkIn("demo-user", "demo-challenge", 37, "550e8400-e29b-41d4-a716-446655440000");
    expect(board.challenge.savedAmount).toBe(1287000);
    expect(board.cells[36].amount).toBe(37000);
  });
  it("rejects a duplicate cell", () => {
    const service = new ChallengesService();
    try {
      service.checkIn("demo-user", "demo-challenge", 24, "550e8400-e29b-41d4-a716-446655440001");
      throw new Error("expected duplicate cell to fail");
    } catch (error) {
      expect((error as { getResponse: () => { error: { code: string } } }).getResponse().error.code).toBe("CELL_ALREADY_COMPLETED");
    }
  });
});
