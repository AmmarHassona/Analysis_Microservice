import { Controller, Param, Post, Body, Logger, Req, UnauthorizedException } from '@nestjs/common';
import { AnalysisService } from '../services/analysis.service';

@Controller('analysis')
export class AnalysisController {
  private readonly logger = new Logger(AnalysisController.name);

  constructor(private readonly analysisService: AnalysisService) {}

  @Post('/budget')
  async analyzeBudget(
    @Body() body: { budgets: Record<string, number> },
    @Req() req: any,
  ) {

    const token = (req.headers.authorization as string)?.split(' ')[1];
    if (!token) {
        throw new UnauthorizedException('Authorization token is required');
    }

    const validationResult = await this.analysisService.validateToken(token);
    if (!validationResult.isValid) {
        throw new UnauthorizedException('Token validation failed');
    }

    
    const { budgets } = body;

    if (!budgets) {
      return { error: 'Budgets not provided' };
    }

    
    return await this.analysisService.analyzeBudget(validationResult.userId, budgets);
  }
}
