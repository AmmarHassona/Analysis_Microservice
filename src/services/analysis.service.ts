import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse, AxiosError } from 'axios';
import { lastValueFrom } from 'rxjs';
import { plainToInstance } from 'class-transformer';
import { SpendingTrendDto } from '../dto/spending-trend.dto';
import { SpendingRecommendationDto } from '../dto/spending-recommendation.dto';

@Injectable()
export class AnalysisService {
  constructor(private readonly httpService: HttpService) {}

  // Fetch spending trends from Flask
  async getTrends(): Promise<any> {
    console.log('Fetching spending trends from Flask API...');
    try {
      const response: AxiosResponse = await lastValueFrom(
        this.httpService.get('http://127.0.0.1:5000/get-trends'),
      );
  
      console.log('Raw Flask response:', response.data);
  
      if (response.data.status !== 'success') {
        throw new Error('Error in Flask API response');
      }
  
      return response.data.trends; // Return raw trends data
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error fetching trends from Flask:', axiosError.message);
      if (axiosError.response) {
        console.error('Flask error details:', axiosError.response.data);
      }
      throw new HttpException(
        {
          message: 'Failed to fetch trends from Flask API',
          details: axiosError.response?.data || {},
        },
        axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }  

  async getRecommendations(): Promise<any> {
    console.log('Fetching recommendations from Flask API...');
    try {
      const response: AxiosResponse = await lastValueFrom(
        this.httpService.get('http://127.0.0.1:5000/generate-recommendations'),
      );
  
      console.log('Raw Flask response:', response.data);
  
      if (response.data.status !== 'success') {
        throw new Error('Error in Flask API response');
      }
  
      return response.data.recommendations; // Return raw recommendations data
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error fetching recommendations from Flask:', axiosError.message);
      if (axiosError.response) {
        console.error('Flask error details:', axiosError.response.data);
      }
      throw new HttpException(
        {
          message: 'Failed to fetch recommendations from Flask API',
          details: axiosError.response?.data || {},
        },
        axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
}