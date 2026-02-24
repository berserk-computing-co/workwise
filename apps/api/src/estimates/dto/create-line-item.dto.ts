import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateLineItemDto {
  @IsUUID()
  sectionId: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumber()
  unitCost: number;
}
