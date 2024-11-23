import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AnalysisReportDocument = AnalysisReport & Document;

@Schema()
export class AnalysisReport {

  @Prop({ required: true })
  userId!: string;

  @Prop({ default: Date.now })
  reportDate!: Date;

  @Prop({ required: true })
  reportContent!: string;
  
}

export const AnalysisReportSchema = SchemaFactory.createForClass(AnalysisReport);