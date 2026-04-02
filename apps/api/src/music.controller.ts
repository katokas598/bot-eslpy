import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsUrl, Max, Min } from "class-validator";
import { PrismaService } from "./prisma.service";

type LoopMode = "off" | "track" | "queue";
type MusicState = {
  paused: boolean;
  volume: number;
  loop: LoopMode;
  autoplay: boolean;
};

const musicStateByProject = new Map<string, MusicState>();

function getState(projectId: string): MusicState {
  const existing = musicStateByProject.get(projectId);
  if (existing) return existing;
  const created: MusicState = { paused: false, volume: 100, loop: "off", autoplay: false };
  musicStateByProject.set(projectId, created);
  return created;
}

class QueueTrackDto {
  @IsNotEmpty()
  projectId!: string;

  @IsNotEmpty()
  title!: string;

  @IsUrl()
  sourceUrl!: string;

  @IsNotEmpty()
  requestedBy!: string;
}

class VolumeDto {
  @IsInt()
  @Min(1)
  @Max(200)
  volume!: number;
}

class LoopDto {
  @IsIn(["off", "track", "queue"])
  mode!: LoopMode;
}

class AutoplayDto {
  @IsBoolean()
  enabled!: boolean;
}

@Controller("music")
export class MusicController {
  constructor(private readonly prisma: PrismaService) {}

  @Post("queue")
  async queue(@Body() dto: QueueTrackDto) {
    const count = await this.prisma.musicQueueItem.count({
      where: { projectId: dto.projectId }
    });

    return this.prisma.musicQueueItem.create({
      data: {
        projectId: dto.projectId,
        title: dto.title,
        sourceUrl: dto.sourceUrl,
        requestedBy: dto.requestedBy,
        position: count + 1
      }
    });
  }

  @Get("queue/:projectId")
  async getQueue(@Param("projectId") projectId: string) {
    return this.prisma.musicQueueItem.findMany({
      where: { projectId },
      orderBy: { position: "asc" }
    });
  }

  @Post("skip/:projectId")
  async skip(@Param("projectId") projectId: string) {
    const first = await this.prisma.musicQueueItem.findFirst({
      where: { projectId },
      orderBy: { position: "asc" }
    });

    if (!first) {
      return { ok: false, message: "Queue is empty" };
    }

    await this.prisma.musicQueueItem.delete({ where: { id: first.id } });
    const tracks = await this.prisma.musicQueueItem.findMany({
      where: { projectId },
      orderBy: { position: "asc" }
    });

    await Promise.all(
      tracks.map((track, index) =>
        this.prisma.musicQueueItem.update({
          where: { id: track.id },
          data: { position: index + 1 }
        })
      )
    );

    return { ok: true, skipped: first.title };
  }

  @Get("nowplaying/:projectId")
  async nowPlaying(@Param("projectId") projectId: string) {
    const first = await this.prisma.musicQueueItem.findFirst({
      where: { projectId },
      orderBy: { position: "asc" }
    });
    return { nowPlaying: first };
  }

  @Post("pause/:projectId")
  async pause(@Param("projectId") projectId: string) {
    const state = getState(projectId);
    state.paused = true;
    return { ok: true, state };
  }

  @Post("resume/:projectId")
  async resume(@Param("projectId") projectId: string) {
    const state = getState(projectId);
    state.paused = false;
    return { ok: true, state };
  }

  @Post("stop/:projectId")
  async stop(@Param("projectId") projectId: string) {
    await this.prisma.musicQueueItem.deleteMany({ where: { projectId } });
    const state = getState(projectId);
    state.paused = false;
    return { ok: true };
  }

  @Post("volume/:projectId")
  async volume(@Param("projectId") projectId: string, @Body() dto: VolumeDto) {
    const state = getState(projectId);
    state.volume = Math.min(200, Math.max(1, Math.round(dto.volume)));
    return { ok: true, state };
  }

  @Post("shuffle/:projectId")
  async shuffle(@Param("projectId") projectId: string) {
    const queue = await this.prisma.musicQueueItem.findMany({
      where: { projectId },
      orderBy: { position: "asc" }
    });
    const shuffled = [...queue].sort(() => Math.random() - 0.5);
    await Promise.all(
      shuffled.map((item, index) =>
        this.prisma.musicQueueItem.update({
          where: { id: item.id },
          data: { position: index + 1 }
        })
      )
    );
    return { ok: true };
  }

  @Post("loop/:projectId")
  async loop(@Param("projectId") projectId: string, @Body() dto: LoopDto) {
    const state = getState(projectId);
    state.loop = dto.mode;
    return { ok: true, state };
  }

  @Post("autoplay/:projectId")
  async autoplay(@Param("projectId") projectId: string, @Body() dto: AutoplayDto) {
    const state = getState(projectId);
    state.autoplay = dto.enabled;
    return { ok: true, state };
  }
}
