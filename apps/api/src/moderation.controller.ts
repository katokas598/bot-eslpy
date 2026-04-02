import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { IsIn, IsNotEmpty, IsOptional } from "class-validator";
import { PrismaService } from "./prisma.service";

class ModerationActionDto {
  @IsNotEmpty()
  projectId!: string;

  @IsIn(["warn", "mute", "kick", "ban"])
  action!: "warn" | "mute" | "kick" | "ban";

  @IsNotEmpty()
  targetTag!: string;

  @IsNotEmpty()
  reason!: string;

  @IsOptional()
  duration?: string;
}

@Controller("moderation")
export class ModerationController {
  constructor(private readonly prisma: PrismaService) {}

  @Post("action")
  async action(@Body() dto: ModerationActionDto) {
    return this.prisma.moderationAction.create({ data: dto });
  }

  @Get("history")
  async history() {
    return this.prisma.moderationAction.findMany({
      orderBy: { createdAt: "desc" },
      take: 100
    });
  }

  @Get("warnings/:targetTag")
  async warnings(@Param("targetTag") targetTag: string) {
    return this.prisma.moderationAction.findMany({
      where: { action: "warn", targetTag },
      orderBy: { createdAt: "desc" }
    });
  }
}
