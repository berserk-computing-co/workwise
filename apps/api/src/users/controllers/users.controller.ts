import { Body, Controller, Get, Patch } from "@nestjs/common";
import { UsersService } from "../services/users.service.js";
import { UpdateUserDto } from "../dto/update-user.dto.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import type { JwtPayload } from "../../common/decorators/current-user.decorator.js";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  async getMe(@CurrentUser() payload: JwtPayload) {
    return this.usersService.findByAuthIdOrFail(payload.sub);
  }

  @Patch("me")
  async updateMe(
    @CurrentUser() payload: JwtPayload,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(payload.sub, dto);
  }
}
