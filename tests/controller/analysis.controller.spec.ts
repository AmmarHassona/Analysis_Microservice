import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisController } from '../../src/controllers/analysis.controller';
import { AnalysisService } from '../../src/services/analysis.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AnalysisController', () => {
  let controller: AnalysisController;
  let service: AnalysisService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisController],
      providers: [
        {
          provide: AnalysisService,
          useValue: {
            validateToken: jest.fn(), // mock validateToken
            analyzeBudget: jest.fn(), // mock analyzeBudget
          },
        },
      ],
    }).compile();

    controller = module.get<AnalysisController>(AnalysisController);
    service = module.get<AnalysisService>(AnalysisService);
  });

  it('should throw UnauthorizedException if token is missing', async () => {
    // missing authorization header for token 
    const req: any = { headers: {} }; 

    await expect(controller.analyzeBudget(req)).rejects.toThrow(
      new UnauthorizedException('Authorization token is required'),
    );
  });

  it('should throw UnauthorizedException if token validation fails', async () => {
    // token is not valid throws and exception 
    jest.spyOn(service , 'validateToken').mockResolvedValue({ isValid: false , userId: '' });

    const mockReq = { headers: { authorization: 'Bearer invalidToken' } };
    await expect(controller.analyzeBudget(mockReq)).rejects.toThrow(UnauthorizedException);
  });

  it('should return an error if budgets are not provided' , async () => {
    // budgets are not provided returns an error 
    jest.spyOn(service , 'validateToken').mockResolvedValue({
      isValid: true,
      userId: 'user123',
    });

    const mockReq = { headers: { authorization: 'Bearer validToken' } };

    const result = await controller.analyzeBudget(mockReq);

    expect(result).toEqual({ error: 'Budgets not provided' });

  });

  it('should call analyzeBudget with correct parameters', async () => {
    // mock values for token, user , and budgets
    const mockToken = 'validToken';
    const mockUserId = 'user123';
    const mockBudgets = { food: 100 , rent: 500 };
    const mockValidationResponse = { isValid: true , userId: mockUserId , budgets: mockBudgets };

    // mock validateToken to return the expected response
    jest.spyOn(service , 'validateToken').mockResolvedValue(mockValidationResponse);
    jest.spyOn(service , 'analyzeBudget').mockResolvedValue({ result: 'success' });

    const req: any = { headers: { authorization: `Bearer ${mockToken}` } };

    const result = await controller.analyzeBudget(req);

    expect(service.validateToken).toHaveBeenCalledWith(mockToken);
    expect(service.analyzeBudget).toHaveBeenCalledWith(mockUserId , mockBudgets);
    expect(result).toEqual({ result: 'success' });
  });
});