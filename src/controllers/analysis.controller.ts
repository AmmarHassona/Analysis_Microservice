import { Controller, Get, Post, Body } from '@nestjs/common';
import { AnalysisService } from '../services/analysis.service';
import { AnalysisReport } from '../schemas/analysis_report.schema';
import { SpendingRecommendation } from '../schemas/spending_recommendation.schema';
import { SpendingTrend } from '../schemas/spending_trend.schema';
import { CreateReportDto } from '../dto/create-report.dto';

@Controller('analysis')
export class AnalysisController {
  
  constructor(private readonly analysisService: AnalysisService) {}

  @Get('trends')
  async getTrends(): Promise<SpendingTrend[]> {
    return this.analysisService.getTrends();
  }

  @Get('recommendations')
  async getRecommendations(): Promise<SpendingRecommendation[]> {
    return this.analysisService.getRecommendations();
  }

  @Post('report')
  async createReport(@Body() createReportDto: CreateReportDto): Promise<AnalysisReport> {
    return this.analysisService.createReport(createReportDto);
  }

}