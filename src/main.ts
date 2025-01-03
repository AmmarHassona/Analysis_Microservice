import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('Main');

  // Create the main app
  const app = await NestFactory.create(AppModule);

  // Connect the microservice for RabbitMQ


  app.enableCors({
    origin: 'https://personalfinancetracker-production-f962.up.railway.app', // Allow only the frontend origin
    credentials: true, // Allow credentials (cookies, headers, etc.)
  });
app.useGlobalPipes(new ValidationPipe({ transform: true }));

  await app.startAllMicroservices();

  const PORT = process.env.PORT || 5000; // Railway assigns a PORT
  await app.listen(PORT, () => {
    console.log(`Application running on port ${PORT}`);
  });

  logger.log('HTTP Server listening on http://localhost:3000');
  logger.log('Microservice connected to RabbitMQ');
}

bootstrap();
