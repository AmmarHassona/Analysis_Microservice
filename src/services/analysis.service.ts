import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import * as path from 'path';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  async analyzeBudget(userId: string, budgets: Record<string, number>): Promise<any> {
    const scriptPath = path.resolve(__dirname, '../../analysis/transaction/analysis_model.py');
    const filePath = path.resolve(__dirname, `../../imports/${userId}_transactions.csv`);
    const budgetsString = JSON.stringify(budgets).replace(/"/g, '\\"'); // Escape quotes for JSON

    return new Promise((resolve, reject) => {
      // Escaped command for safe argument passing
      const command = `python "${scriptPath}" "${filePath}" "${budgetsString}"`;

      this.logger.log(`Executing command: ${command}`);

      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`Python script execution failed: ${stderr}`);
          reject(`Error analyzing budget: ${stderr || error.message}`);
          return;
        }

        try {
          const result = JSON.parse(stdout.trim());
          if (result.error) {
            this.logger.error(`Python script error: ${result.error}`);
            reject(result.error);
          } else {
            resolve(result);
          }
        } catch (parseError) {
          this.logger.error(`Error parsing Python script output: ${(parseError as Error).message}`);
          reject('Invalid response from the analysis script');
        }
      });
    });
  }
}
