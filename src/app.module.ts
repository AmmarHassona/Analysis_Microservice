import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AnalysisService } from './services/analysis.service';
import { AnalysisController } from './controllers/analysis.controller';
import { AnalysisReport, AnalysisReportSchema } from './schemas/analysis_report.schema';
import { SpendingRecommendation, SpendingRecommendationSchema } from './schemas/spending_recommendation.schema';
import { SpendingTrend, SpendingTrendSchema } from './schemas/spending_trend.schema';
import{AnalysisQueueListenerService} from './services/analysisQueueListen.service';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import base64 from 'base-64';



@Module({
  imports: [
    ConfigModule.forRoot(),
    EventEmitterModule.forRoot(),
    // MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/analysis'),
    // MongooseModule.forFeature([
    //   { name: AnalysisReport.name, schema: AnalysisReportSchema },
    //   { name: SpendingRecommendation.name, schema: SpendingRecommendationSchema },
    //   { name: SpendingTrend.name, schema: SpendingTrendSchema },
    // ]),
    HttpModule,
    ClientsModule.register([
      {
        name: 'ANALYSIS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'analysis_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService, AnalysisQueueListenerService,EventEmitter2],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly queueListener: AnalysisQueueListenerService) {}

  async onApplicationBootstrap() {
    // Start listening to the RabbitMQ queue when the app starts
    await this.queueListener.listenForResponses();
  }
}