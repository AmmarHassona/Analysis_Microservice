import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisService } from '../../src/services/analysis.service';
import { spawn } from 'child_process';
import { UnauthorizedException } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import path from 'path';

jest.mock('child_process', () => ({
  spawn: jest.fn(() => ({
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() },
    on: jest.fn((event, callback) => {
      if (event === 'close') callback(0); // Simulate successful execution
    }),
  })),
}));

jest.mock('amqplib', () => ({
  connect: jest.fn().mockResolvedValue({
    createChannel: jest.fn().mockResolvedValue({
      assertQueue: jest.fn(),
      sendToQueue: jest.fn(),
    }),
  }),
}));

describe('AnalysisService', () => {
  let service: AnalysisService;

  beforeAll(async () => {
    process.env.RABBITMQ_URL = 'amqp://uWrDtSMTnKyEsLAt:885N.tcwDaZqcaUt0M7aHXhuveiKH5bC@junction.proxy.rlwy.net:22410';

    const module: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [AnalysisService],
    }).compile();

    service = module.get<AnalysisService>(AnalysisService);
  });

  afterAll(() => {
    jest.clearAllMocks();
    delete process.env.RABBITMQ_URL;
  });

  it('should validate token and return valid response', async () => {
    const token = 'valid-token';
    const result = await service.validateToken(token);
    expect(result).toEqual({ valid: true });
  } , 20000);

  it('should throw error if no token is provided', async () => {
    process.env.RABBITMQ_URL = ''; // Simulate missing RabbitMQ URL
    await expect(service.validateToken('')).rejects.toThrow(
      new UnauthorizedException('RABBITMQ_URL is not defined')
    );
  });

  it('should analyze budget and return results', async () => {
    const mockPythonProcess = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn((event, callback) => { if (event === 'close') callback(0); }), // simulate success
    };

    (spawn as jest.Mock).mockReturnValue(mockPythonProcess);

    const mockResult = { result: 'success' };
    mockPythonProcess.stdout.on.mockImplementation((event, callback) => {
      if (event === 'data') callback(JSON.stringify(mockResult)); // mock Python output
    });

    const userId = 'user123';
    const result = await service.analyzeBudget(userId, { food: 100, rent: 500 });
    expect(result).toEqual(mockResult); // ensure correct result is returned

    const expectedPythonArgs = [
      'python3',
      path.resolve(__dirname, '../../analysis/transaction/analysis_model.py'),
      path.resolve(__dirname, `../../imports/${userId}_transactions.csv`), 
      '{"food":100,"rent":500}',
    ];
    
    expect(spawn).toHaveBeenCalledWith(...expectedPythonArgs);    
  });

  it('should throw an error if Python script execution fails', async () => {
    const mockPythonProcess = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn((event, callback) => { if (event === 'close') callback(1); }), // simulate failure
    };

    (spawn as jest.Mock).mockReturnValue(mockPythonProcess);

    mockPythonProcess.stderr.on.mockImplementation((event, callback) => {
      if (event === 'data'){
        callback('Error executing Python script');
      }
    });

    const userId = 'user123';
    await expect(service.analyzeBudget(userId, { food: 100, rent: 500 })).rejects.toThrow('Error analyzing budget: Error executing Python script');
  });
});