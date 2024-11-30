import { Controller, Get } from '@nestjs/common';
import { AnalysisService } from '../services/analysis.service';
import { SpendingTrendDto } from '../dto/spending-trend.dto';
import { SpendingRecommendationDto } from '../dto/spending-recommendation.dto';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get('trends')
  async getTrends(): Promise<SpendingTrendDto[]> {
    console.log('Controller: Fetching spending trends...');
    return this.analysisService.getTrends();
  }

  @Get('recommendations')
  async getRecommendations(): Promise<SpendingRecommendationDto[]> {
    console.log('Controller: Fetching spending recommendations...');
    return this.analysisService.getRecommendations();
  }
}