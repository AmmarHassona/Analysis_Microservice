import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Main');
  
  try {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    await app.listen(3000);
    logger.log('http://localhost:3000');

    const microservice  = await NestFactory.createMicroservice(AppModule, {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'analysis_queue',
        queueOptions: {
          durable: false,
        },
      
      },
    });

    microservice .listen().then(() => {
      logger.log('Analysis Microservice is connected to RabbitMQ');
      logger.log('Listening for events...');
    });
  } catch (error) {
    logger.error('Failed to start Analysis Microservice:', error);
    process.exit(1);
  }
}
bootstrap();