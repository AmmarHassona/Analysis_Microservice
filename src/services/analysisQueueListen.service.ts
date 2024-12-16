import { Injectable, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { sharedEventEmitter } from '../utils/shared-event-emitter';

@Injectable()
export class AnalysisQueueListenerService {
    private readonly logger = new Logger(AnalysisQueueListenerService.name);
    private connection!: amqp.Connection;
    private channel!: amqp.Channel;
    private readonly responseEvent = 'analysisResponse'; // Event name for token validation

    private chunksBuffer: { [key: string]: { [key: number]: string } } = {};
    private totalChunks: { [key: string]: number } = {};
    private reconstructedFiles: Map<string, string> = new Map();



    async listenForResponses() {
        const rabbitmqUrl = process.env.RABBITMQ_URL;
        if (!rabbitmqUrl) {
            throw new Error('RABBITMQ_URL is not defined');
        }

        try {
            this.connection = await amqp.connect(rabbitmqUrl);
            this.channel = await this.connection.createChannel();
            const queueName = 'analysis_queue';

            await this.channel.assertQueue(queueName, { durable: true });
            this.logger.log(`Listening for messages on queue: ${queueName}`);

            this.channel.consume(
                queueName,
                async (msg) => {
                    if (msg) {
                        try {

                          const content = msg.content.toString();
                          this.logger.debug(`Raw message content: ${content}`); // Log raw message content
            
                          const parsedMessage = JSON.parse(content);
            
                          // Fallback for legacy or malformed messages
                          if (!parsedMessage.message) {
                            this.logger.warn('Message does not contain the "message" property. Attempting fallback.');
                            parsedMessage.message = parsedMessage;
                          }

                            const correlationId = msg.properties.correlationId;

                            // Handle token validation responses
                            if (parsedMessage && 'isValid' in parsedMessage && 'userId' in parsedMessage) {
                                this.logger.log(`Token validation response received for correlationId: ${correlationId}`);
                                sharedEventEmitter.emit(this.responseEvent, { correlationId, response: parsedMessage });
                                this.channel.ack(msg);
                                return;
                            }

                            // Handle chunked file data
                            const { userId, chunkIndex, totalChunks, chunk } = parsedMessage.message;

              if (!userId || chunkIndex === undefined || !totalChunks || !chunk) {
                this.logger.error('Parsed message is missing required fields.');
                this.channel.nack(msg, false, false); // Reject the message and do not requeue
                return;
              }

              // Process valid chunks
              if (!this.chunksBuffer[userId]) {
                this.chunksBuffer[userId] = {};
                this.totalChunks[userId] = totalChunks;
              }

              this.chunksBuffer[userId][chunkIndex] = chunk;

              if (Object.keys(this.chunksBuffer[userId]).length === this.totalChunks[userId]) {
                const fullData = Object.keys(this.chunksBuffer[userId])
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map((key) => this.chunksBuffer[userId][parseInt(key)])
                  .join('');

                await this.processReconstructedData(userId, fullData);
                delete this.chunksBuffer[userId];
                delete this.totalChunks[userId];
              }

              this.channel.ack(msg);
            } catch (error) {
              this.logger.error(`Error processing message: ${(error as Error).message}`);
              this.channel.nack(msg, false, false); // Reject the message and do not requeue
            }
          }
        },
        { noAck: false }
      );
    } catch (error) {
      this.logger.error(`Failed to listen to RabbitMQ: ${(error as Error).message}`);
      throw error;
    }
  }

  private async processReconstructedData(userId: string, fullData: string): Promise<void> {
    try {
      const decodedCsvData = Buffer.from(fullData, 'base64').toString('utf-8');
      const importsDir = path.resolve(process.cwd(), 'imports');
      const filePath = path.join(importsDir, `${userId}_transactions.csv`);

      await fsp.mkdir(importsDir, { recursive: true });
      await fsp.writeFile(filePath, decodedCsvData, 'utf8');

      this.reconstructedFiles.set(userId, filePath);
      this.logger.log(`CSV file saved for userId: ${userId} at ${filePath}`);
    } catch (error) {
      this.logger.error(`Error processing reconstructed data: ${(error as Error).message}`);
      throw error;
    }
  }

  getReconstructedFile(userId: string): string | null {
    return this.reconstructedFiles.get(userId) || null;
  }
}