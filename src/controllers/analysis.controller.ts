import { Controller, Logger, Post , Body , Get } from '@nestjs/common';
import { AnalysisService } from '../services/analysis.service';
import { EventPattern } from '@nestjs/microservices';
import axios from 'axios';

@Controller('comparison')
export class AnalysisController {

  private readonly logger = new Logger(AnalysisController.name);
  
  constructor(private readonly analysisService: AnalysisService) {}

  @EventPattern('transaction_created')
  async handleTransactionCreated(data: any) {
    this.logger.log('Controller: Received transaction_created event');
    return this.analysisService.handleTransactionCreated(data);
  }

  @EventPattern('user_transactions_fetched')
  async handleUserTransactionsFetched(data: any) {
    this.logger.log('Controller: Received user_transactions_fetched event');
    try {
      await this.analysisService.handleUserTransactionsFetched(data);
    } catch (error) {
      this.logger.error('Error handling transactions in controller:');
      throw error;
    }
  }

  @Post('get-comparison')
  async getComparison(@Body() budgets: any): Promise<any> {
    this.logger.log('Received budgets:', budgets);  // Logging for debugging
    return await this.analysisService.getComparisonFromFlask(budgets);
  }

}