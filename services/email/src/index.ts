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
  const ROUTING_KEY = "email.send";

  await channel.assertExchange(EXCHANGE, "direct", {
    durable: true,
  });

  await channel.assertQueue(QUEUE, {
    durable: true,
  });

  await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

  channel.prefetch(1);

  console.log("Email service started");

  channel.consume(
    QUEUE,
    (message) => {
      if (message) {
        try {
          handleMessage(JSON.parse(message.content.toString()));
          channel.ack(message);
        } catch (error) {
          console.error(error);
          channel.nack(message, false, false);
        }
      }
    },
    { noAck: false }
  );
}

main();
