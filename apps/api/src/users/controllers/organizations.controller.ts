import { Body, Controller, Get, Patch } from "@nestjs/common";
import { OrganizationsService } from "../services/organizations.service.js";
import { UpdateOrganizationDto } from "../dto/update-organization.dto.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import type { JwtPayload } from "../../common/decorators/current-user.decorator.js";

@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get("me")
  async getMe(@CurrentUser() payload: JwtPayload) {
    return this.organizationsService.findByAuthId(payload.sub);
  }

  @Patch("me")
  async updateMe(
    @CurrentUser() payload: JwtPayload,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(payload.sub, dto);
  }
}
