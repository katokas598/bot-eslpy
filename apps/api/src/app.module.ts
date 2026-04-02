import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { PrismaService } from "./prisma.service";
import { ProjectsController } from "./projects.controller";
import { TicketsController } from "./tickets.controller";
import { MusicController } from "./music.controller";
import { ModerationController } from "./moderation.controller";
import { NotificationsController } from "./notifications.controller";
import { ConfigController } from "./config.controller";
import { AuthController } from "./auth.controller";
import { RbacController } from "./rbac.controller";

@Module({
  imports: [],
  controllers: [
    AppController,
    ProjectsController,
    TicketsController,
    MusicController,
    ModerationController,
    NotificationsController,
    ConfigController,
    AuthController,
    RbacController
  ],
  providers: [PrismaService]
})
export class AppModule {}
