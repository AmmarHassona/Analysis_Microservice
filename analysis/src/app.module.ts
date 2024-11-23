import { Module } from '@nestjs/common';
import { AnalysisModule } from './utils/analysis.module';

@Module({
  imports: [AnalysisModule]
})
export class AppModule {}
