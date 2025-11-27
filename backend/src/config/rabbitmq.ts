import amqp, { Connection, Channel } from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

let connection: Connection | null = null;
let channel: Channel | null = null;

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672';
const EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'clinic_os_events';

export async function connectRabbitMQ(): Promise<Channel | null> {
  if (channel) {
    return channel;
  }

  try {
    const conn = await amqp.connect(RABBITMQ_URL);
    connection = conn as unknown as Connection;
    channel = await (connection as any).createChannel();
    
    // Declare exchange
    await channel.assertExchange(EXCHANGE, 'topic', {
      durable: true,
    });

    console.log('RabbitMQ Connected');
    return channel;
  } catch (error) {
    console.error('RabbitMQ Connection Error:', error);
    console.warn('Continuing without RabbitMQ - event publishing will be disabled');
    return null;
  }
}

export async function closeRabbitMQ(): Promise<void> {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
  if (connection) {
    await (connection as any).close();
    connection = null;
  }
  } catch (error) {
    // Ignore errors on close
  }
}

export function getChannel(): Channel | null {
  return channel;
}

export function getExchange(): string {
  return EXCHANGE;
}

export async function publishEvent(
  routingKey: string,
  data: Record<string, any>
): Promise<boolean> {
  if (!channel) {
    await connectRabbitMQ();
  }

  if (!channel) {
    console.warn(`RabbitMQ not available - event not published: ${routingKey}`);
    return false;
  }

  try {
    return channel.publish(
      EXCHANGE,
      routingKey,
      Buffer.from(JSON.stringify(data)),
      {
        persistent: true,
      }
    );
  } catch (error) {
    console.error('Error publishing event:', error);
    return false;
  }
}

