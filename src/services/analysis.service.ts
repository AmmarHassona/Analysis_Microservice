import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import * as path from 'path';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  async analyzeBudget(userId: string, budgets: Record<string, number>): Promise<any> {
    const scriptPath = path.resolve(__dirname, '../../analysis/transaction/analysis_model.py');
    const filePath = path.resolve(__dirname, `../../imports/${userId}_transactions.csv`);
    const budgetsString = JSON.stringify(budgets).replace(/"/g, '\\"');

    return new Promise((resolve, reject) => {
      // Explicitly use 'python3' instead of 'python'
      const command = `python3 "${scriptPath}" "${filePath}" "${budgetsString}"`;

      this.logger.log(`Executing command: ${command}`);

      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`Python script execution failed: ${stderr}`);
          reject(`Error analyzing budget: ${stderr || error.message}`);
          return;
        }

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
