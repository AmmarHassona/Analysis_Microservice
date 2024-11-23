import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SpendingTrendDocument = SpendingTrend & Document;

@Schema()
export class SpendingTrend {
  
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  category!: string;

  @Prop({
    type: [{ date: { type: Date, required: true }, amount: { type: Number, required: true } }],
    required: true,
  })
  spendingHistory!: { date: Date; amount: number }[];

  @Prop({ required: true })
  averageSpend!: number;

  @Prop({ required: true })
  transactionType!: string;

}

export const SpendingTrendSchema = SchemaFactory.createForClass(SpendingTrend);