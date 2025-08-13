import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateDescriptionDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
