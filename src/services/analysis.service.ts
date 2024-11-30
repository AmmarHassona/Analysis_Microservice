import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse, AxiosError } from 'axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AnalysisService {
  constructor(private readonly httpService: HttpService) {}

  // Fetch and transform spending trends from Flask
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
  
      const transformedTrends = this.transformTrends(response.data.trends); // Transform data here
      return transformedTrends;
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

  // Fetch and transform recommendations from Flask
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
  
      const transformedRecommendations = this.transformRecommendations(response.data.recommendations); // Transform data here
      return transformedRecommendations;
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

  // Transform trends to the desired format
  private transformTrends(trends: any[]): any[] {
    return trends.map(trend => ({
      userId: trend.user_id,
      category: trend.category,
      month: trend.month,
      predictedSpending: trend.predicted_spending,
      recommendedAmount: trend.recommended_amount,
      reason: trend.reason,
      generatedAt: trend.generated_at,
    }));
  }

  // Transform recommendations to the desired format
  private transformRecommendations(recommendations: any[]): any[] {
    return recommendations.map(recommendation => ({
      userId: recommendation.user_id,
      category: recommendation.category,
      month: recommendation.month,
      predictedSpending: recommendation.predicted_spending,
      recommendedAmount: recommendation.recommended_amount,
      reason: recommendation.reason,
      generatedAt: recommendation.generated_at,
    }));
  }
}
