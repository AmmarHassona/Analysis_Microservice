import { Controller, Get, Post, Body } from '@nestjs/common';
import { AnalysisService } from '../services/analysis.service';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get('trends')
  async getSpendingTrends() {
    return this.analysisService.getTrends();
  }

  @Get('recommendations')
  async getRecommendations() {
    return this.analysisService.getRecommendations();
  }

  @Post('report')
  async createReport(@Body() body: any) {
    return this.analysisService.createReport(body);
  }
}
