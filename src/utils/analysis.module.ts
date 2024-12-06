import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AnalysisService } from '../services/analysis.service';
import { AnalysisController } from '../controllers/analysis.controller';
import { AnalysisReport, AnalysisReportSchema } from '../schemas/analysis_report.schema';
import { SpendingRecommendation, SpendingRecommendationSchema } from '../schemas/spending_recommendation.schema';
import { SpendingTrend, SpendingTrendSchema } from '../schemas/spending_trend.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/finance-tracker'),
    MongooseModule.forFeature([
      { name: AnalysisReport.name, schema: AnalysisReportSchema },
      { name: SpendingRecommendation.name, schema: SpendingRecommendationSchema },
      { name: SpendingTrend.name, schema: SpendingTrendSchema },
    ]),
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService],
})
export class AnalysisModule {}
