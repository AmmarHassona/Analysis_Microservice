import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisService } from '../../src/services/analysis.service';
import * as amqp from 'amqplib';
import { spawn } from 'child_process';
import { EventEmitter2 } from 'eventemitter2';

process.env.RABBITMQ_URL = 'amqp://uWrDtSMTnKyEsLAt:885N.tcwDaZqcaUt0M7aHXhuveiKH5bC@junction.proxy.rlwy.net:22410';
jest.setTimeout(60000);

// Mock amqplib.connect
jest.mock('amqplib', () => ({
    connect: jest.fn().mockImplementation((url) => {
      if (url.includes('invalid')) {
        return Promise.reject(new Error('RabbitMQ connection issue'));
      }
  
      return Promise.resolve({
        createChannel: jest.fn().mockResolvedValue({
          assertQueue: jest.fn(),
          sendToQueue: jest.fn(),
        }),
      });
    }),
  }));   

// Mock child_process.spawn
jest.mock('child_process', () => {
    const mockSpawn = jest.fn();
  
    mockSpawn.mockImplementation((cmd, args) => {
      if (args.includes('fail')) {
        return {
          stdout: {
            on: jest.fn(),
          },
          stderr: {
            on: jest.fn().mockImplementation((event, callback) => {
              if (event === 'data') callback('error occurred');
            }),
          },
          on: jest.fn().mockImplementation((event, callback) => {
            if (event === 'close') callback(1);
          }),
        };
      }
  
      return {
        stdout: {
          on: jest.fn().mockImplementation((event, callback) => {
            if (event === 'data') callback(JSON.stringify({ analysis: 'success' }));
          }),
        },
        stderr: { on: jest.fn() },
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'close') callback(0);
        }),
      };
    });
  
    return { spawn: mockSpawn };
  });    

describe('AnalysisService', () => {
  let service: AnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalysisService, EventEmitter2],
    }).compile();

    service = module.get<AnalysisService>(AnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeBudget', () => {
    it('should return success if Python script runs successfully', async () => {
      const mockSpawn = spawn as jest.Mock;
      mockSpawn.mockReturnValue({
        stdout: {
          on: jest.fn().mockImplementation((event, callback) =>
            event === 'data' ? callback(JSON.stringify({ analysis: 'success' })) : null
          ),
        },
        stderr: { on: jest.fn() },
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'close') callback(0);
        }),
      });

      const result = await service.analyzeBudget('user123', { food: 200, transport: 100 });
      expect(result).toEqual({ analysis: 'success' });
      expect(spawn).toHaveBeenCalled();
    });

    it('should throw error if Python script fails', async () => {
        const mockSpawn = spawn as jest.Mock;
        
        mockSpawn.mockReturnValue({
          stdout: {
            on: jest.fn(),
          },
          stderr: {
            on: jest.fn().mockImplementation((event, callback) => callback('error occurred')),
          },
          on: jest.fn().mockImplementation((event, callback) => {
            if (event === 'close') callback(1);
          }),
        });
      
        await expect(
          service.analyzeBudget('user123', { food: 200, transport: 100 })
        ).rejects.toThrowError('Error analyzing budget: error occurred');
      });           
  });

//   describe('validateToken', () => {
//     it('should return success for a valid token without timing out', async () => {
//       const mockAmqpConnect = amqp.connect as jest.Mock;
  
//       mockAmqpConnect.mockResolvedValue({
//         createChannel: jest.fn().mockResolvedValue({
//           assertQueue: jest.fn(),
//           sendToQueue: jest.fn(),
//         }),
//       });
  
//       const result = await service.validateToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFtbWFyaGFzc29uYTE1QGdtYWlsLmNvbSIsInN1YiI6IjBmYmI4YzU1LWUwZDAtNDM4YS1iMTY1LWUxNjc4NWZhMDdlNyIsImlhdCI6MTczNDQ0NTI4MiwiZXhwIjoxNzM0NTMxNjgyfQ.U9wjsiu8ampbcaYC6tkXkcQ7OtUC-8BeFZxx-bRb-sI');
//       expect(result).toHaveProperty('isValid');
//       expect(result).toHaveProperty('userId');
//     });
  
//     it('should timeout when RabbitMQ connection fails', async () => {
//         const timeoutSpy = jest.spyOn(global, 'setTimeout');
//         const mockAmqpConnect = amqp.connect as jest.Mock;
      
//         // Simulate RabbitMQ connection failure
//         mockAmqpConnect.mockRejectedValueOnce(new Error('RabbitMQ connection issue'));
      
//         await expect(service.validateToken('valid_token')).rejects.toThrow('Connection error');
        
//         expect(timeoutSpy).toHaveBeenCalled();
//         timeoutSpy.mockRestore();
//       });      
//   });  
});