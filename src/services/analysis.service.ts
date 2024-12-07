import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  async analyzeBudget(userId: string, budgets: Record<string, number>): Promise<any> {
    const scriptPath = path.resolve(__dirname, '../../analysis/transaction/analysis_model.py');
    const filePath = path.resolve(__dirname, `../../imports/${userId}_transactions.csv`);
    const budgetsString = JSON.stringify(budgets); // Pass budgets as JSON string

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [scriptPath, filePath, budgetsString]);

      let stdoutData = '';
      let stderrData = '';

      // Capture standard output
      pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      // Capture standard error
      pythonProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      // Handle script completion
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          this.logger.error(`Python script failed with error: ${stderrData}`);
          reject(new Error(`Error analyzing budget: ${stderrData}`));
          return;
        }

        try {
          const result = JSON.parse(stdoutData.trim());
          resolve(result);
        } catch (error) {
          this.logger.error(`Failed to parse Python script output: ${(error as Error).message}`);
          reject(new Error('Invalid response from the Python script'));
        }
      });
    });
  }
}
