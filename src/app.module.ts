import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalysisService } from './services/analysis.service';
import { AnalysisController } from './controllers/analysis.controller';
import { AnalysisReport , AnalysisReportSchema } from './schemas/analysis_report.schema';
import { SpendingRecommendation , SpendingRecommendationSchema } from './schemas/spending_recommendation.schema';
import { SpendingTrend , SpendingTrendSchema } from './schemas/spending_trend.schema';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb+srv://ammar:Csik2De8hrBk1NQx@analysisdb.r2wtm.mongodb.net/?retryWrites=true&w=majority&appName=AnalysisDB'),
    MongooseModule.forFeature([
      { name: AnalysisReport.name, schema: AnalysisReportSchema },
      { name: SpendingRecommendation.name, schema: SpendingRecommendationSchema },
      { name: SpendingTrend.name, schema: SpendingTrendSchema },
    ]),
    HttpModule
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService],
})
export class AppModule {}