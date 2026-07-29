import { ChallengesService } from "../src/challenges/challenges.service";

describe("ChallengesService", () => {
  it("creates a challenge for the authenticated user and calculates amounts", () => {
    const service = new ChallengesService();
    const userId = "user-1";
    const initial = service.board(userId);
    const board = service.checkIn(userId, initial.challenge.id, 37, "550e8400-e29b-41d4-a716-446655440000");
    expect(board.challenge.savedAmount).toBe(37000);
    expect(board.cells[36].amount).toBe(37000);
  });

  it("rejects a duplicate cell", () => {
    const service = new ChallengesService();
    const userId = "user-1";
    const initial = service.board(userId);
    service.checkIn(userId, initial.challenge.id, 24, "550e8400-e29b-41d4-a716-446655440001");
    try {
      service.checkIn(userId, initial.challenge.id, 24, "550e8400-e29b-41d4-a716-446655440002");
      throw new Error("expected duplicate cell to fail");
    } catch (error) {
      expect((error as { getResponse: () => { error: { code: string } } }).getResponse().error.code).toBe("CELL_ALREADY_COMPLETED");
    }
  });
});
