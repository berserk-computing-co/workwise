import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateOptionDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  total?: number;

  @IsOptional()
  @IsBoolean()
  isRecommended?: boolean;
}
