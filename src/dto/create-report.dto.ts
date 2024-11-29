import { IsString , IsDate , IsNotEmpty } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsDate()
  @IsNotEmpty()
  reportDate?: Date;

  @IsString()
  @IsNotEmpty()
  reportContent!: string;
}