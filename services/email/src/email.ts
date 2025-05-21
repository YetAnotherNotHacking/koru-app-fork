import { z } from "zod";
import React from "react";
import { Resend } from "resend";

import env from "@/env";

import "@/emails/index";
import { emailRegistry } from "@/email-registry";

const resend = new Resend(env.RESEND_API_KEY);

export function handleMessage(message: unknown) {
  const messageSchema = z.object({
    type: z.string(),
    to: z.string().email(),
    subject: z.string(),
    payload: z.unknown(),
  });

  const parsedMessage = messageSchema.parse(message);

  const emailModule = emailRegistry[parsedMessage.type];

  if (!emailModule) {
    throw new Error(`Email module not found for type: ${parsedMessage.type}`);
  }

  const parsedPayload = emailModule.schema.parse(parsedMessage.payload);

  const EmailComponent = emailModule.component;

  resend.emails.send({
    from: "Koru App <koru@jamdon2.dev>",
    to: parsedMessage.to,
    subject: parsedMessage.subject,
    react: React.createElement(EmailComponent, parsedPayload),
  });
}
