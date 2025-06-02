import amqp from "amqplib";
import env from "./env";
import "@/emails";
import { handleMessage } from "@/email";

async function main() {
  const connection = await amqp.connect({
    hostname: env.RABBITMQ_HOST,
    port: env.RABBITMQ_PORT,
    username: env.RABBITMQ_USER,
    password: env.RABBITMQ_PASSWORD,
    vhost: env.RABBITMQ_VHOST,
  });

  const channel = await connection.createChannel();

  const EXCHANGE = "koru.email.dx";
  const QUEUE = "koru.email.q";
  const EMAIL_SEND_ROUTING_KEY = "email.send";
  const WAITLIST_ADD_ROUTING_KEY = "email.waitlist.add";

  await channel.assertExchange(EXCHANGE, "direct", {
    durable: true,
  });

  await channel.assertQueue(QUEUE, {
    durable: true,
  });

  await channel.bindQueue(QUEUE, EXCHANGE, EMAIL_SEND_ROUTING_KEY);
  await channel.bindQueue(QUEUE, EXCHANGE, WAITLIST_ADD_ROUTING_KEY);

  channel.prefetch(1);

  console.log(
    `Email service started, listening on queue ${QUEUE} for routing keys: ${EMAIL_SEND_ROUTING_KEY}, ${WAITLIST_ADD_ROUTING_KEY}`
  );

  channel.consume(
    QUEUE,
    async (message) => {
      if (message) {
        try {
          console.log(
            `Received message on queue ${QUEUE} with routing key ${message.fields.routingKey}`
          );
          await handleMessage(
            JSON.parse(message.content.toString()),
            message.fields.routingKey
          );
          channel.ack(message);
        } catch (error) {
          console.error(
            `Error processing message from ${QUEUE} (routing key: ${message?.fields?.routingKey || "unknown"}):`,
            error
          );
          channel.nack(message, false, false);
        }
      }
    },
    { noAck: false }
  );
}

main();
