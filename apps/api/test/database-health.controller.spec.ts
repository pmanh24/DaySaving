import { DatabaseHealthController } from "../src/health/database-health.controller";

describe("DatabaseHealthController", () => {
  it("returns the required connected payload after a successful ping", async () => {
    const connection = {
      db: { command: jest.fn().mockResolvedValue({ ok: 1 }) },
      readyState: 1,
    } as never;
    const controller = new DatabaseHealthController(connection);

    await expect(controller.database()).resolves.toEqual({
      status: "connected",
      database: "saving_100_app",
      readyState: 1,
    });
  });

  it("returns a service-unavailable error when ping fails", async () => {
    const connection = {
      db: { command: jest.fn().mockRejectedValue(new Error("unavailable")) },
      readyState: 0,
    } as never;
    const controller = new DatabaseHealthController(connection);

    await expect(controller.database()).rejects.toMatchObject({
      status: 503,
      response: {
        status: "disconnected",
        database: "saving_100_app",
        readyState: 0,
      },
    });
  });
});
