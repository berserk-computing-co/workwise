import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
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

export class AuthSetupCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @IsOptional()
  @IsNumber()
  burdenMultiplier?: number;

  @IsOptional()
  @IsNumber()
  overheadMultiplier?: number;

  @IsOptional()
  @IsNumber()
  profitMargin?: number;

  @IsOptional()
  @IsNumber()
  taxRate?: number;
}

export class AuthSetupDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => AuthSetupUserDto)
  user: AuthSetupUserDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => AuthSetupCompanyDto)
  company: AuthSetupCompanyDto;
}
