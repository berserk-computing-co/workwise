import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AuthSetupUserDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class AuthSetupOrganizationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  zipCode: string;
}

export class AuthSetupDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => AuthSetupUserDto)
  user: AuthSetupUserDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => AuthSetupOrganizationDto)
  organization: AuthSetupOrganizationDto;
}
