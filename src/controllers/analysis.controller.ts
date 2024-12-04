import { Controller, Logger } from '@nestjs/common';
import { AnalysisService } from '../services/analysis.service';
import { EventPattern } from '@nestjs/microservices';

@Controller()
export class AnalysisController {
  private readonly logger = new Logger(AnalysisController.name);
  
  constructor(private readonly analysisService: AnalysisService) {}

  @EventPattern('transaction_created')
  async handleTransactionCreated(data: any) {
    this.logger.log('Controller: Received transaction_created event');
    return this.analysisService.handleTransactionCreated(data);
  } // comment this one 

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
}