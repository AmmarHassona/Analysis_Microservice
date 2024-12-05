import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern } from '@nestjs/microservices';
import { Parser } from 'json2csv';
import * as fs from 'fs';
import * as path from 'path';
import axios, { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class AnalysisService {

  private readonly logger = new Logger(AnalysisService.name);
  private readonly flaskApiUrl = 'http://localhost:5000/get-comparison';
  
  constructor(private readonly httpService: HttpService) {} 

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
  async handleUserTransactionsFetched(data: any): Promise<void> {
    this.logger.log('Service: Processing user_transactions_fetched event');
    this.logger.debug('Received data:', data);

    try {
      if (!data || !data.transactions || data.transactions.length === 0) {
        this.logger.warn('No transactions to process');
        return;
      }

      // Dynamically set the exports folder in the project root
      const baseDir = path.resolve(process.cwd(), 'exports');
      const filePath = path.join(baseDir, 'transactions.csv');

      // Ensure the directory exists
      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
        this.logger.log('Created directory: ${baseDir}');
      }

      // Convert transactions to CSV
      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(data.transactions);

      // Write CSV to file
      fs.writeFileSync(filePath, csv);
      this.logger.log('Transactions exported to: ${filePath}');
    } catch (error) {
      this.logger.error('Error exporting transactions: ${error}');
      throw error;
    }
  }

  async getComparisonFromFlask(budgets: any): Promise<any> {
    console.log('Budgets passed to Flask:', budgets);
  
    try {
      const response = await firstValueFrom(
        this.httpService.post(this.flaskApiUrl, { budgets })
      );
      console.log('Response from Flask:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error retrieving data from Flask:', error);
      throw error;
    }
  }
  
}