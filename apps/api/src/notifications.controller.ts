import { Body, Controller, Post } from "@nestjs/common";
import { IsNotEmpty } from "class-validator";
import { PrismaService } from "./prisma.service";

class NotifyDto {
  @IsNotEmpty()
  actor!: string;

  @IsNotEmpty()
  event!: string;

  payload!: unknown;
}

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async notify(@Body() dto: NotifyDto) {
    await this.prisma.auditLog.create({
      data: {
        actor: dto.actor,
        event: dto.event,
        payload: (dto.payload ?? {}) as object
      }
    });

    return { ok: true };
  }
}
