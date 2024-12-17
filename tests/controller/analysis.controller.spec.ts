import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisController } from '../../src/controllers/analysis.controller'
import { AnalysisService } from '../../src/services/analysis.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AnalysisController', () => {
  let controller: AnalysisController;
  let analysisService: AnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisController],
      providers: [
        {
          provide: AnalysisService,
          useValue: {
            validateToken: jest.fn(),
            analyzeBudget: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AnalysisController>(AnalysisController);
    analysisService = module.get<AnalysisService>(AnalysisService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should throw UnauthorizedException if no token is provided', async () => {
    const req = { headers: { authorization: null } };
    await expect(controller.analyzeBudget(req)).rejects.toThrowError(UnauthorizedException);
  });

  it('should throw UnauthorizedException if token validation fails', async () => {
    const req = { headers: { authorization: 'Bearer invalid_token' } };
    jest.spyOn(analysisService, 'validateToken').mockResolvedValue({ isValid: false, userId: null });

    await expect(controller.analyzeBudget(req)).rejects.toThrowError(UnauthorizedException);
  });

  it('should call analyzeBudget when token is valid', async () => {
    const req = { headers: { authorization: 'Bearer valid_token' } };
    jest.spyOn(analysisService, 'validateToken').mockResolvedValue({ isValid: true, userId: 'user123', budgets: { food: 200, transport: 100 } });
    jest.spyOn(analysisService, 'analyzeBudget').mockResolvedValue({ analysis: 'data' });

    const result = await controller.analyzeBudget(req);
    expect(result).toEqual({ analysis: 'data' });
    expect(analysisService.analyzeBudget).toHaveBeenCalledWith('user123', { food: 200, transport: 100 });
  });

  it('should return an error if budgets are not provided', async () => {
    const req = { headers: { authorization: 'Bearer valid_token' } };
    jest.spyOn(analysisService, 'validateToken').mockResolvedValue({ isValid: true, userId: 'user123', budgets: null });

    const result = await controller.analyzeBudget(req);
    expect(result).toEqual({ error: 'Budgets not provided' });
  });
});