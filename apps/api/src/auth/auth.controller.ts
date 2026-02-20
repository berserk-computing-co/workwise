import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthSetupDto } from './dto/auth-setup.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../common/decorators/current-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('setup')
  @HttpCode(HttpStatus.CREATED)
  async setup(
    @CurrentUser() payload: JwtPayload,
    @Body() dto: AuthSetupDto,
  ) {
    return this.authService.setup(payload.sub, dto);
  }
}
