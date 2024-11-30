import { Expose } from 'class-transformer';

export class SpendingTrendDto {
  @Expose()
  amount!: number;

  @Expose()
  category!: string;

  @Expose()
  date!: string;

  @Expose()
  month!: string;

  @Expose()
  user_id!: string;

  @Expose()
  vendor!: string;
}