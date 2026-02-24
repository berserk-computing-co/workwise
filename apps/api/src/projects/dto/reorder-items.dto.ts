import { IsArray, IsUUID } from 'class-validator';

export class ReorderItemsDto {
  @IsUUID()
  sectionId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  itemIds: string[];
}
