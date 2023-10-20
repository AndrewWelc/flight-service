import { ApiProperty } from '@nestjs/swagger';

export class SliceDto {
  @ApiProperty()
  origin_name: string;

  @ApiProperty()
  destination_name: string;

  @ApiProperty()
  departure_date_time_utc: string;

  @ApiProperty()
  arrival_date_time_utc: string;

  @ApiProperty()
  flight_number: string;

  @ApiProperty()
  duration: number;
}
