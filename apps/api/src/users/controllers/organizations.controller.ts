import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrganizationsService } from '../services/organizations.service.js';
import { UpdateOrganizationDto } from '../dto/update-organization.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../common/decorators/current-user.decorator.js';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('me')
  async getMe(@CurrentUser() payload: JwtPayload) {
    return this.organizationsService.findByAuthId(payload.sub);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() payload: JwtPayload,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(payload.sub, dto);
  }

  @Post('me/logo')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Only image files are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadLogo(
    @CurrentUser() payload: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.organizationsService.uploadLogo(payload.sub, file);
  }
}
