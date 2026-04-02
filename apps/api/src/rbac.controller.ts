import { Body, Controller, Post } from "@nestjs/common";
import { IsIn, IsNotEmpty } from "class-validator";

type Role = "Owner" | "Admin" | "Moderator" | "Support" | "DJ" | "Member" | "Viewer";

const rolePermissions: Record<Role, string[]> = {
  Owner: ["*"],
  Admin: ["*"],
  Moderator: ["moderation.*", "ticket.read", "ticket.update"],
  Support: ["ticket.*", "queue.read", "nowplaying.read"],
  DJ: ["music.*", "queue.read", "nowplaying.read"],
  Member: ["help.read", "ticket.create", "queue.read", "nowplaying.read"],
  Viewer: ["help.read"]
};

class CheckPermissionDto {
  @IsIn(["Owner", "Admin", "Moderator", "Support", "DJ", "Member", "Viewer"])
  role!: Role;

  @IsNotEmpty()
  permission!: string;
}

@Controller("rbac")
export class RbacController {
  @Post("check")
  check(@Body() dto: CheckPermissionDto) {
    const perms = rolePermissions[dto.role];
    const ok =
      perms.includes("*") ||
      perms.includes(dto.permission) ||
      perms.some((perm) => perm.endsWith(".*") && dto.permission.startsWith(perm.replace(".*", ".")));
    return { ok, role: dto.role, permission: dto.permission };
  }
}
