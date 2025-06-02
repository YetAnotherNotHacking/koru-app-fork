import { z } from "zod";
import React from "react";
import { Resend } from "resend";

import env from "@/env";

import "@/emails/index";
import { emailRegistry } from "@/email-registry";

const resend = new Resend(env.RESEND_API_KEY);

async function sendEmail(message: unknown) {
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

  const result = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: parsedMessage.to,
    subject: parsedMessage.subject,
    react: React.createElement(EmailComponent, parsedPayload),
  });

  if (result.error) {
    throw new Error(result.error.message);
  } else {
    console.log(`Sent email to ${parsedMessage.to}`);
  }
}

async function addToWaitlist(message: unknown) {
  const messageSchema = z.object({
    email: z.string().email(),
  });

  const parsedMessage = messageSchema.parse(message);

  const result = await resend.contacts.create({
    email: parsedMessage.email,
    audienceId: env.RESEND_AUDIENCE_ID,
  });

  if (result.error) {
    throw new Error(result.error.message);
  } else {
    console.log(`Added ${parsedMessage.email} to waitlist`);
  }
}

export async function handleMessage(message: unknown, routingKey: string) {
  if (routingKey === "email.send") {
    await sendEmail(message);
  } else if (routingKey === "email.waitlist.add") {
    await addToWaitlist(message);
  }
}
