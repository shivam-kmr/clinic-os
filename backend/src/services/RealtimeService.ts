import { Response } from 'express';
import { QueueService } from './QueueService';
import { logger } from '../config/logger';
import { getChannel, getExchange } from '../config/rabbitmq';

interface SSEClient {
  hospitalId?: string;
  doctorId?: string;
  departmentId?: string;
  response: Response;
}

class RealtimeService {
  private clients: Map<string, SSEClient> = new Map();
  private consumerTag: string | null = null;

  /**
   * Initialize RabbitMQ consumer for SSE
   */
  async initialize(): Promise<void> {
    try {
      const channel = getChannel();
      if (!channel) {
        logger.warn('RabbitMQ channel not available - SSE will work but without RabbitMQ events');
        return;
      }

      const exchange = getExchange();
      const queue = 'sse_queue';

      // Declare queue
      await channel.assertQueue(queue, { durable: true });

      // Bind queue to exchange
      await channel.bindQueue(queue, exchange, 'visit.*');
      await channel.bindQueue(queue, exchange, 'appointment.*');
      await channel.bindQueue(queue, exchange, 'queue.*');

      // Consume messages
      const consumer = await channel.consume(
        queue,
        async (msg) => {
          if (!msg) return;

          try {
            const data = JSON.parse(msg.content.toString());
            const routingKey = msg.fields.routingKey;

            // Broadcast to relevant clients
            this.broadcastToClients(routingKey, data);

            channel.ack(msg);
          } catch (error) {
            logger.error('Error processing SSE message:', error);
            channel.nack(msg, false, false);
          }
        },
        { noAck: false }
      );

      this.consumerTag = consumer.consumerTag;
      logger.info('SSE service initialized with RabbitMQ');
    } catch (error) {
      logger.warn('Error initializing SSE service with RabbitMQ - continuing without RabbitMQ events:', error);
      // Don't throw - allow server to start without RabbitMQ
    }
  }

  /**
   * Add SSE client
   */
  addClient(clientId: string, client: SSEClient): void {
    this.clients.set(clientId, client);
    logger.info(`SSE client connected: ${clientId}`);
  }

  /**
   * Remove SSE client
   */
  removeClient(clientId: string): void {
    this.clients.delete(clientId);
    logger.info(`SSE client disconnected: ${clientId}`);
  }

  /**
   * Broadcast to relevant clients based on routing key
   */
  private broadcastToClients(routingKey: string, data: any): void {
    const relevantClients: SSEClient[] = [];

    if (routingKey.startsWith('visit.')) {
      // Visit events - send to hospital, doctor, or department clients
      for (const client of this.clients.values()) {
        if (
          client.hospitalId === data.hospitalId ||
          client.doctorId === data.doctorId ||
          client.departmentId === data.departmentId
        ) {
          relevantClients.push(client);
        }
      }
    } else if (routingKey.startsWith('appointment.')) {
      // Appointment events - send to hospital clients
      for (const client of this.clients.values()) {
        if (client.hospitalId === data.hospitalId) {
          relevantClients.push(client);
        }
      }
    } else if (routingKey.startsWith('queue.')) {
      // Queue events - send to all relevant clients
      for (const client of this.clients.values()) {
        if (
          client.hospitalId === data.hospitalId ||
          client.doctorId === data.doctorId ||
          client.departmentId === data.departmentId
        ) {
          relevantClients.push(client);
        }
      }
    }

    // Send to relevant clients
    for (const client of relevantClients) {
      try {
        client.response.write(`data: ${JSON.stringify({ type: routingKey, data })}\n\n`);
      } catch (error) {
        logger.error('Error sending SSE message to client:', error);
        this.removeClient(client.response.locals.clientId);
      }
    }
  }

  /**
   * Setup SSE connection for reception dashboard
   */
  async setupReceptionSSE(
    response: Response,
    hospitalId: string
  ): Promise<void> {
    const clientId = `reception_${hospitalId}_${Date.now()}`;
    response.locals.clientId = clientId;

    // Set SSE headers
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Add client
    this.addClient(clientId, {
      hospitalId,
      response,
    });

    // Send initial connection message
    response.write(`data: ${JSON.stringify({ type: 'connected', data: { hospitalId } })}\n\n`);

    // Send initial queue data
    try {
      // This would need to be implemented to get all queues for hospital
      // For now, just send a connection confirmation
    } catch (error) {
      logger.error('Error sending initial queue data:', error);
    }

    // Handle client disconnect
    response.on('close', () => {
      this.removeClient(clientId);
    });
  }

  /**
   * Setup SSE connection for doctor screen
   */
  async setupDoctorSSE(
    response: Response,
    hospitalId: string,
    doctorId: string
  ): Promise<void> {
    const clientId = `doctor_${doctorId}_${Date.now()}`;
    response.locals.clientId = clientId;

    // Set SSE headers
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no');

    // Add client
    this.addClient(clientId, {
      hospitalId,
      doctorId,
      response,
    });

    // Send initial connection message
    response.write(
      `data: ${JSON.stringify({ type: 'connected', data: { hospitalId, doctorId } })}\n\n`
    );

    // Send initial queue data
    try {
      const queue = await QueueService.getQueueForDoctor(hospitalId, doctorId);
      response.write(
        `data: ${JSON.stringify({ type: 'queue.updated', data: queue })}\n\n`
      );
    } catch (error) {
      logger.error('Error sending initial queue data:', error);
    }

    // Handle client disconnect
    response.on('close', () => {
      this.removeClient(clientId);
    });
  }

  /**
   * Setup SSE connection for waiting room
   */
  async setupWaitingRoomSSE(
    response: Response,
    hospitalId: string,
    departmentId: string
  ): Promise<void> {
    const clientId = `waiting_room_${departmentId}_${Date.now()}`;
    response.locals.clientId = clientId;

    // Set SSE headers
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no');

    // Add client
    this.addClient(clientId, {
      hospitalId,
      departmentId,
      response,
    });

    // Send initial connection message
    response.write(
      `data: ${JSON.stringify({ type: 'connected', data: { hospitalId, departmentId } })}\n\n`
    );

    // Send initial queue data (public view - no patient names)
    try {
      const queue = await QueueService.getQueueForDepartment(hospitalId, departmentId);
      // Remove patient names for public view
      const publicQueue = {
        ...queue,
        queue: queue.queue.map((item) => ({
          tokenNumber: item.tokenNumber,
          status: item.status,
          estimatedWaitTime: item.estimatedWaitTime,
        })),
      };
      response.write(
        `data: ${JSON.stringify({ type: 'queue.updated', data: publicQueue })}\n\n`
      );
    } catch (error) {
      logger.error('Error sending initial queue data:', error);
    }

    // Handle client disconnect
    response.on('close', () => {
      this.removeClient(clientId);
    });
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    if (this.consumerTag) {
      const channel = await getChannel();
      if (channel) {
        await channel.cancel(this.consumerTag);
      }
    }
    this.clients.clear();
  }
}

export default new RealtimeService();

