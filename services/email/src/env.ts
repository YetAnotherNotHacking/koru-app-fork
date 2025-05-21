import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  RABBITMQ_HOST: z.string().default("localhost"),
  RABBITMQ_PORT: z.number().default(5672),
  RABBITMQ_USER: z.string().default("guest"),
  RABBITMQ_PASSWORD: z.string().default("guest"),
  RABBITMQ_VHOST: z.string().default("/"),
  RESEND_API_KEY: z.string(),
});

export default envSchema.parse(process.env);
