import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { AxiosError } from 'axios';
import { lastValueFrom } from 'rxjs';
import { SpendingTrend } from '../schemas/spending_trend.schema';
import { SpendingRecommendation } from '../schemas/spending_recommendation.schema';

@Injectable()
export class AnalysisService {

  constructor(private readonly httpService: HttpService) {}

  async getTrends(): Promise<SpendingTrend[]> {
    console.log('Making request to Flask API for trends...');
    try {
      const response: AxiosResponse<SpendingTrend[]> = await lastValueFrom(
        this.httpService.get('http://127.0.0.1:5000/get-trends')
      );
      console.log('Flask response for trends:', response.data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error fetching trends from Flask:', axiosError.message);
      if (axiosError.response) {
        console.error('Flask error details:', axiosError.response.data);
      }
      throw error;
    }
  }  

  async getRecommendations(): Promise<SpendingRecommendation[]> {
    console.log('Making request to Flask API for recommendations...');
    try {
      const response: AxiosResponse<SpendingRecommendation[]> = await lastValueFrom(
        this.httpService.get('http://127.0.0.1:5000/generate-recommendations')
      );
      console.log('Flask response for recommendations:', response.data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error fetching recommendations from Flask:', axiosError.message);
      if (axiosError.response) {
        console.error('Flask error details:', axiosError.response.data);
      }
      throw error;
    }
  }  

}