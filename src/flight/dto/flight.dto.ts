import { ApiProperty } from '@nestjs/swagger';
import { SliceDto } from './slice.dto';

export class FlightDto {
  @ApiProperty({ type: [SliceDto] })
  slices: SliceDto[];

  @ApiProperty()
  price: number;
}
