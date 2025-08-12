// dto/update-task-position.dto.ts
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateTaskPositionDto {
  @IsOptional()
  @IsUUID()
  beforeId?: string; // task nằm trước vị trí mới

  @IsOptional()
  @IsUUID()
  afterId?: string; // task nằm sau vị trí mới

  @IsOptional()
  @IsUUID()
  targetListId?: string; // list mới (nếu move sang list khác)
}
