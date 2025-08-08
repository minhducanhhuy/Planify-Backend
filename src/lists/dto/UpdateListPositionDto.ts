// dto/update-list-position.dto.ts
import { IsOptional, IsUUID, IsNotEmpty } from 'class-validator';

export class UpdateListPositionDto {
  @IsOptional()
  @IsUUID()
  beforeId?: string; // ID của list nằm trước vị trí mới

  @IsOptional()
  @IsUUID()
  afterId?: string; // ID của list nằm sau vị trí mới
}
