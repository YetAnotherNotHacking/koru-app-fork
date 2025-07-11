// This file is auto-generated by @hey-api/openapi-ts

import { z } from "zod";

export const zValidationError = z.object({
  loc: z.array(z.unknown()),
  msg: z.string(),
  type: z.string(),
});

export const zHttpValidationError = z.object({
  detail: z.array(zValidationError).optional(),
});

export const zItem = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.union([z.string(), z.null()]).optional(),
  price: z.number(),
  category: z.string(),
});

export const zItemCreate = z.object({
  name: z.string(),
  description: z.union([z.string(), z.null()]).optional(),
  price: z.number(),
  category: z.string(),
});

export const zUser = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string(),
  age: z.union([z.number().int(), z.null()]).optional(),
});

export const zUserCreate = z.object({
  name: z.string(),
  email: z.string(),
  age: z.union([z.number().int(), z.null()]).optional(),
});

export const zUserUpdate = z.object({
  name: z.union([z.string(), z.null()]).optional(),
  email: z.union([z.string(), z.null()]).optional(),
  age: z.union([z.number().int(), z.null()]).optional(),
});

export const zGetAllUsersResponse = z.array(zUser);

export const zCreateUserResponse = zUser;

export const zGetUserResponse = zUser;

export const zUpdateUserResponse = zUser;

export const zGetItemsResponse = z.array(zItem);

export const zCreateItemResponse = zItem;

export const zGetItemResponse = zItem;
