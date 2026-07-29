import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthController {
  @Get("health")
  health(): { success: true; data: { status: string; database: string } } {
    return { success: true, data: { status: "ok", database: process.env.MONGODB_URI ? "configured" : "in-memory" } };
  }
}
