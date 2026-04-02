import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { IsIn, IsNotEmpty, IsOptional } from "class-validator";
import { PrismaService } from "./prisma.service";

class CreateTicketDto {
  @IsNotEmpty()
  projectId!: string;

  @IsNotEmpty()
  title!: string;

  @IsIn(["low", "medium", "high", "urgent"])
  @IsOptional()
  priority?: "low" | "medium" | "high" | "urgent";

  @IsOptional()
  assigneeTag?: string;
}

class TicketMemberDto {
  @IsNotEmpty()
  userTag!: string;
}

class TicketPriorityDto {
  @IsIn(["low", "medium", "high", "urgent"])
  priority!: "low" | "medium" | "high" | "urgent";
}

@Controller("tickets")
export class TicketsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async create(@Body() dto: CreateTicketDto) {
    return this.prisma.ticket.create({
      data: {
        projectId: dto.projectId,
        title: dto.title,
        priority: dto.priority ?? "medium",
        assigneeTag: dto.assigneeTag,
        status: "open"
      }
    });
  }

  @Get("project/:projectId")
  async byProject(@Param("projectId") projectId: string) {
    return this.prisma.ticket.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" }
    });
  }

  @Patch(":ticketId/close")
  async close(@Param("ticketId") ticketId: string) {
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: "closed" }
    });
  }

  @Patch(":ticketId/claim")
  async claim(@Param("ticketId") ticketId: string, @Body() dto: TicketMemberDto) {
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { assigneeTag: dto.userTag, status: "claimed" }
    });
  }

  @Patch(":ticketId/unclaim")
  async unclaim(@Param("ticketId") ticketId: string) {
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { assigneeTag: null, status: "open" }
    });
  }

  @Patch(":ticketId/priority")
  async priority(@Param("ticketId") ticketId: string, @Body() dto: TicketPriorityDto) {
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { priority: dto.priority }
    });
  }

  @Post(":ticketId/escalate")
  async escalate(@Param("ticketId") ticketId: string) {
    return this.prisma.auditLog.create({
      data: {
        actor: "system",
        event: "ticket.escalated",
        payload: { ticketId }
      }
    });
  }

  @Post(":ticketId/transcript")
  async transcript(@Param("ticketId") ticketId: string) {
    return {
      ticketId,
      transcriptUrl: `https://example.local/transcripts/${ticketId}.txt`,
      generatedAt: new Date().toISOString()
    };
  }
}
