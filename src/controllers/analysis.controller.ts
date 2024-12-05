import { Controller, Logger, Post , Body , Get, Param } from '@nestjs/common';
import { AnalysisService } from '../services/analysis.service';
import { EventPattern } from '@nestjs/microservices';
import axios from 'axios';

@Controller()
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

  @Post('/get-comparison')
  async getComparison(@Body() budgets: Record<string, number>) {
    try {
      const comparisonData = await this.analysisService.getComparison(budgets);
      return comparisonData;  // Return the data received from Flask
    } catch (error) {
      this.logger.error('Error getting comparison data from Flask API:', error);
      return { error: error || 'An error occurred while processing your request' };
    }
  }

}