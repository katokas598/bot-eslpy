import { Body, Controller, Get, Headers, Post, UnauthorizedException } from "@nestjs/common";
import { IsEmail, IsIn, IsNotEmpty, MinLength } from "class-validator";
import { compare, hash } from "bcryptjs";
import { PrismaService } from "./prisma.service";
import { sign, verify } from "jsonwebtoken";

type Role = "Owner" | "Admin" | "Moderator" | "Support" | "DJ" | "Member" | "Viewer";

class LoginDto {
  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;
}

class RegisterDto {
  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;

  @IsIn(["Owner", "Admin", "Moderator", "Support", "DJ", "Member", "Viewer"])
  role!: Role;
}

class RefreshDto {
  @IsNotEmpty()
  refreshToken!: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Post("register")
  async register(@Body() dto: RegisterDto) {
    const passwordHash = await hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, role: dto.role }
    });
    return { id: user.id, email: user.email, role: user.role };
  }

  @Post("login")
  async login(@Body() dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException("Invalid credentials");
    const ok = await compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    const accessToken = sign(
      { sub: user.id, role: user.role, email: user.email },
      process.env.JWT_ACCESS_SECRET ?? "dev_access_secret",
      { expiresIn: "30m" }
    );
    const refreshToken = sign(
      { sub: user.id, role: user.role, email: user.email, type: "refresh" },
      process.env.JWT_REFRESH_SECRET ?? "dev_refresh_secret",
      { expiresIn: "30d" }
    );

    return { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } };
  }

  @Post("refresh")
  async refresh(@Body() dto: RefreshDto) {
    try {
      const payload = verify(dto.refreshToken, process.env.JWT_REFRESH_SECRET ?? "dev_refresh_secret") as {
        sub: string;
        role: Role;
        email: string;
      };
      const accessToken = sign(
        { sub: payload.sub, role: payload.role, email: payload.email },
        process.env.JWT_ACCESS_SECRET ?? "dev_access_secret",
        { expiresIn: "30m" }
      );
      return { accessToken };
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  @Get("me")
  async me(@Headers("authorization") authorization?: string) {
    const token = (authorization ?? "").replace("Bearer ", "");
    try {
      const payload = verify(token, process.env.JWT_ACCESS_SECRET ?? "dev_access_secret") as { sub: string };
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException("User not found");
      return { id: user.id, email: user.email, role: user.role };
    } catch {
      throw new UnauthorizedException("Invalid access token");
    }
  }
}
