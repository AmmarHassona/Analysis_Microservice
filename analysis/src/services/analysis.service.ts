import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SpendingTrend, SpendingTrendDocument } from '../schemas/spending_trend.schema';
import { SpendingRecommendation, SpendingRecommendationDocument } from '../schemas/spending_recommendation.schema';
import { AnalysisReport, AnalysisReportDocument } from '../schemas/analysis_report.schema';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectModel(SpendingTrend.name) private readonly spendingTrendModel: Model<SpendingTrendDocument>,
    @InjectModel(SpendingRecommendation.name) private readonly recommendationModel: Model<SpendingRecommendationDocument>,
    @InjectModel(AnalysisReport.name) private readonly reportModel: Model<AnalysisReportDocument>,
  ) {}

  async getTrends(): Promise<SpendingTrend[]> {
    return this.spendingTrendModel.find().exec();
  }

  async getRecommendations(): Promise<SpendingRecommendation[]> {
    return this.recommendationModel.find().exec();
  }

  async createReport(data: any): Promise<AnalysisReport> {
    const newReport = new this.reportModel(data);
    return newReport.save();
  }
}
