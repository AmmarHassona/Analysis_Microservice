import { Injectable, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { exec } from 'child_process';
import * as path from 'path';
import * as base64 from 'base-64';
import { Buffer } from 'buffer';
import * as fs from 'fs';
import { spawn } from 'child_process';


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
  const budgetsString = JSON.stringify(budgets.budgets || budgets);

  console.log("Budgets JSON String:", budgetsString);

  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python3', [scriptPath, filePath, budgetsString]);

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python script execution failed with code ${code}`);
        console.error(`stderr: ${stderr}`);
        console.error(`stdout: ${stdout}`);
        reject(new Error(`Error analyzing budget: ${stderr || stdout || 'Unknown error'}`));
      } else {
        try {
          // Trim and parse output
          const trimmedOutput = stdout.trim();

          console.log("Raw Python Script Output:", trimmedOutput);

          // Check for valid JSON starting at '{' or '['
          const jsonStartIndex = trimmedOutput.indexOf('{') !== -1 ? trimmedOutput.indexOf('{') : trimmedOutput.indexOf('[');
          if (jsonStartIndex === -1) {
            throw new Error('No valid JSON output detected.');
          }

          const jsonOutput = trimmedOutput.substring(jsonStartIndex);
          const parsedResult = JSON.parse(jsonOutput);

          // Separate analysis and images if structure includes "images"
          if (parsedResult.analysis && parsedResult.images) {
            console.log("Analysis Data:", parsedResult.analysis);
            console.log("Encoded Images Data:", parsedResult.images);
            resolve(parsedResult);
          } else {
            console.log("Parsed Result:", parsedResult);
            resolve(parsedResult); // Fallback to general result
          }
        } catch (parseError) {
          console.error(`Error parsing Python script output: ${(parseError as Error).message}`);
          console.error(`Raw output: ${stdout.trim()}`);
          reject(new Error('Invalid response from analysis script'));
        }
      }
    });
  });
}


}