import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnalysisReport, AnalysisReportDocument } from '../schemas/analysis_report.schema';
import { SpendingRecommendation, SpendingRecommendationDocument } from '../schemas/spending_recommendation.schema';
import { SpendingTrend, SpendingTrendDocument } from '../schemas/spending_trend.schema';
import { CreateReportDto } from '../dto/create-report.dto';

@Injectable()
export class AnalysisService {

  constructor(
    @InjectModel(SpendingTrend.name) private spendingTrendModel: Model<SpendingTrendDocument>,
    @InjectModel(SpendingRecommendation.name) private spendingRecommendationModel: Model<SpendingRecommendationDocument>,
    @InjectModel(AnalysisReport.name) private analysisReportModel: Model<AnalysisReportDocument>
  ) {}

  async getTrends(): Promise<SpendingTrend[]> {
    return this.spendingTrendModel.find().exec();
  }

  async getRecommendations(): Promise<SpendingRecommendation[]> {
    return this.spendingRecommendationModel.find().exec();
  }

  async createReport(createReportDto: CreateReportDto): Promise<AnalysisReport> {
    const newReport = new this.analysisReportModel(createReportDto);
    return newReport.save();
  }

}