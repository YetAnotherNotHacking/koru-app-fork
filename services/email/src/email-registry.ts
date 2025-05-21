import { z } from "zod";

export interface EmailModule<T> {
  component: React.ComponentType<T>;
  type: string;
  schema: z.ZodSchema<T>;
}

export const emailRegistry: Record<string, EmailModule<any>> = {};

export function registerEmail<T>(
  type: string,
  schema: z.ZodSchema<T>,
  component: React.ComponentType<T>
): void {
  emailRegistry[type] = {
    type,
    schema,
    component,
  };
}
