import { IsString, IsNumber } from 'class-validator';

export class SpendingRecommendationDto {
  @IsString()
  userId!: string;

  @IsString()
  category!: string;

  @IsNumber()
  recommendedAmount!: number;

  @IsString()
  recommendationDate!: string;

  @IsString()
  reason!: string;

  @IsNumber()
  confidence?: number;
}