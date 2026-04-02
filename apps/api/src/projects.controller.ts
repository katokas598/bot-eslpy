import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { IsNotEmpty } from "class-validator";
import { PrismaService } from "./prisma.service";

class CreateProjectDto {
  @IsNotEmpty()
  name!: string;
}

@Controller("projects")
export class ProjectsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async create(@Body() dto: CreateProjectDto) {
    return this.prisma.project.create({ data: { name: dto.name } });
  }

  @Get()
  async list() {
    return this.prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  }

  @Get(":projectId")
  async one(@Param("projectId") projectId: string) {
    return this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tickets: true,
        musicTracks: { orderBy: { position: "asc" } },
        rules: true
      }
    });
  }
}
