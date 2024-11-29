import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const port = process.env.PORT;

  await app.listen(port || 3000);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();