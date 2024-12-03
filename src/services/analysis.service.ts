import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern } from '@nestjs/microservices';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  @EventPattern('transaction_created')
  async handleTransactionCreated(data: any) {
    this.logger.log('Received transaction_created event');
    this.logger.debug(data);
    try {
      // Your processing logic here
      return { success: true };
    } catch (error: any) {
      this.logger.error(`Error processing transaction: ${error.message}`);
      throw error;
    }
  }

  @MessagePattern('user_transactions_fetched')
  @EventPattern('user_transactions_fetched')
  async handleUserTransactionsFetched(data: any) {
    this.logger.log('Received user_transactions_fetched event');
    this.logger.debug('Received data:', data);
    try {
      // Your processing logic here
      return { success: true };
    } catch (error: any) {
      this.logger.error(`Error processing transactions: ${error.message}`);
      throw error;
    }
  }
}
