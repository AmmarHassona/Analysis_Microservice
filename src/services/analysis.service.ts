import { Injectable, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { exec } from 'child_process';
import * as path from 'path';

import { EventEmitter2 } from 'eventemitter2';
import { sharedEventEmitter } from '../utils/shared-event-emitter';

interface TokenValidationResponse {
  correlationId: string;
  response: {
      isValid: boolean;
      userId: string;
  };
}


@Injectable()
export class AnalysisService {
  [x: string]: any;
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    
    
    private readonly eventEmitter: EventEmitter2,
) {}



  private generateCorrelationId(): string {
    return Math.random().toString(36).substring(2, 15);
}

async validateToken(token: string): Promise<any> {
  const rabbitmqUrl = process.env.RABBITMQ_URL;
  if (!rabbitmqUrl) throw new Error('RABBITMQ_URL is not defined');

  const requestQueue = 'auth_queue';
  const responseEvent = 'analysisResponse';
  const correlationId = this.generateCorrelationId();
  const message = { token };

  const connection = await amqp.connect(rabbitmqUrl);
  const channel = await connection.createChannel();

  await channel.assertQueue(requestQueue, { durable: true });
  channel.sendToQueue(requestQueue, Buffer.from(JSON.stringify(message)), {
      correlationId,
      replyTo: 'analysis_queue',
  });

  this.logger.log(`Token sent to queue "${requestQueue}" with correlationId: ${correlationId}`);

  return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
          this.logger.error('Timeout waiting for Auth Service response');
          reject(new Error('Timeout waiting for Auth Service response'));
      }, 30000);

      sharedEventEmitter.once(responseEvent, ({ correlationId: respCorrelationId, response }) => {
          if (respCorrelationId === correlationId) {
              clearTimeout(timeout);
              this.logger.log(`Received response for correlationId: ${correlationId}`);
              resolve(response);
          }
      });
  });
}



  async analyzeBudget(userId: string, budgets: Record<string, number>): Promise<any> {
    const scriptPath = path.resolve(__dirname, '../../analysis/transaction/analysis_model.py');
    const filePath = path.resolve(__dirname, `../../imports/${userId}_transactions.csv`);
    const budgetsString = JSON.stringify(budgets).replace(/\\/g, '\\\\').replace(/"/g, '\\"');


    return new Promise((resolve, reject) => {
      // Explicitly use 'python3' instead of 'python'
      const command = `python3 "${scriptPath}" "${filePath}" "${budgetsString}"`;


      this.logger.log(`Executing command: ${command}`);

      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`Python script execution failed: ${stderr || error.message}`);
          reject(`Error analyzing budget: ${stderr || error.message}`);
          return;
        }
      
        this.logger.log(`Python script output: ${stdout.trim()}`);
        try {
          const result = JSON.parse(stdout.trim());
          resolve(result);
        } catch (parseError) {
          this.logger.error(`Error parsing Python script output: ${(parseError as Error).message}`);
          reject('Invalid response from analysis script');
        }
      });
      
    });
  }
}
