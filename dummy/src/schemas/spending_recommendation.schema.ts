import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SpendingRecommendationDocument = SpendingRecommendation & Document;

@Schema({ timestamps: true })
export class SpendingRecommendation {
  
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  category!: string;

  @Prop({ required: true })
  recommendation!: string;

}

export const SpendingRecommendationSchema = SchemaFactory.createForClass(SpendingRecommendation);