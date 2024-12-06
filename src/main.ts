import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('Main');

  // Create the main app
  const app = await NestFactory.create(AppModule);

  // Connect the microservice for RabbitMQ


  await app.startAllMicroservices();
  await app.listen(3000);

  logger.log('HTTP Server listening on http://localhost:3000');
  logger.log('Microservice connected to RabbitMQ');
}

bootstrap();
