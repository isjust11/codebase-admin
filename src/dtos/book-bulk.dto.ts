import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsEnum, IsString } from 'class-validator';
import { CategoryCodeEnum } from 'src/enums/category-code.enum';

export class BulkBookIdsDto {
  @ApiProperty({ type: [String], description: 'Danh sách id sách (base64)' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids: string[];
}

export class BulkBookStatusDto extends BulkBookIdsDto {
  @ApiProperty({ enum: CategoryCodeEnum })
  @IsEnum(CategoryCodeEnum)
  statusCode: CategoryCodeEnum;
}
