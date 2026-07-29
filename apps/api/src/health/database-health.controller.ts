import { Controller, Get, HttpException, HttpStatus } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";

const DATABASE_NAME = "saving_100_app";

@Controller("health")
export class DatabaseHealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get("database")
  async database() {
    try {
      if (!this.connection.db) throw new Error("MongoDB database handle is unavailable");
      await this.connection.db.command({ ping: 1 });
      return { status: "connected", database: DATABASE_NAME, readyState: this.connection.readyState };
    } catch {
      throw new HttpException({ status: "disconnected", database: DATABASE_NAME, readyState: this.connection.readyState }, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
