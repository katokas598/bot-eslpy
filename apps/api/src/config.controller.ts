import { Body, Controller, Get, Post } from "@nestjs/common";
import { IsIn, IsNotEmpty } from "class-validator";

type Language = "ru" | "en";

const configStore = {
  modules: {
    tickets: true,
    music: true,
    moderation: true,
    onboarding: true,
    notifications: true
  },
  logChannelId: "",
  language: "ru" as Language
};

class ModuleToggleDto {
  @IsNotEmpty()
  name!: string;
}

class LogChannelDto {
  @IsNotEmpty()
  channelId!: string;
}

class LanguageDto {
  @IsIn(["ru", "en"])
  language!: Language;
}

@Controller()
export class ConfigController {
  @Get("config/view")
  view() {
    return configStore;
  }

  @Post("config/reload")
  reload() {
    return { ok: true, reloadedAt: new Date().toISOString() };
  }

  @Post("module/enable")
  enable(@Body() dto: ModuleToggleDto) {
    configStore.modules[dto.name as keyof typeof configStore.modules] = true;
    return { ok: true, modules: configStore.modules };
  }

  @Post("module/disable")
  disable(@Body() dto: ModuleToggleDto) {
    configStore.modules[dto.name as keyof typeof configStore.modules] = false;
    return { ok: true, modules: configStore.modules };
  }

  @Post("log/channel")
  logChannel(@Body() dto: LogChannelDto) {
    configStore.logChannelId = dto.channelId;
    return { ok: true, logChannelId: configStore.logChannelId };
  }

  @Post("language/set")
  language(@Body() dto: LanguageDto) {
    configStore.language = dto.language;
    return { ok: true, language: configStore.language };
  }
}
