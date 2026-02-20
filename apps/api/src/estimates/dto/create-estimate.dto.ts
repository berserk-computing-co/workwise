import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEstimateDto {
  @IsString()
  @IsNotEmpty()
  projectDescription: string;

  @IsString()
  @IsNotEmpty()
  jobSiteAddress: string;

  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @IsOptional()
  @IsString()
  tradeCategory?: string;

  @IsOptional()
  @IsString()
  propertyType?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;
}
