import { Controller, Param, Post, Body, Logger } from '@nestjs/common';
import { AnalysisService } from '../services/analysis.service';

@Controller('analysis')
export class AnalysisController {
  private readonly logger = new Logger(AnalysisController.name);

  constructor(private readonly analysisService: AnalysisService) {}

  @Post(':userId/budget')
  async analyzeBudget(
    @Param('userId') userId: string, 
    @Body() body: { budgets: Record<string, number> },
  ) {
    const { budgets } = body;

    if (!budgets) {
      return { error: 'Budgets not provided' };
    }

    this.logger.log(`Received budgets for userId: ${userId}`);
    return await this.analysisService.analyzeBudget(userId, budgets);
  }
}
