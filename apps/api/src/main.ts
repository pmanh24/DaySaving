import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.setGlobalPrefix("api/v1", { exclude: ["health"] });
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000", credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  const swagger = new DocumentBuilder().setTitle("100 Days Saving API").setDescription("API theo dõi thử thách tiết kiệm 100 ô").setVersion("1.0").addBearerAuth().build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, swagger));
  await app.listen(Number(process.env.PORT ?? 4000));
}

void bootstrap();
