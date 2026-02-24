import { IsArray, IsUUID } from 'class-validator';

export class ReorderLineItemsDto {
  @IsUUID()
  sectionId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  itemIds: string[];
}
