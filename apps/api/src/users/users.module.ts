import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity.js";
import { Organization } from "./entities/organization.entity.js";
import { UsersService } from "./services/users.service.js";
import { OrganizationsService } from "./services/organizations.service.js";
import { UsersController } from "./controllers/users.controller.js";
import { OrganizationsController } from "./controllers/organizations.controller.js";

@Module({
  imports: [TypeOrmModule.forFeature([User, Organization])],
  controllers: [UsersController, OrganizationsController],
  providers: [UsersService, OrganizationsService],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
