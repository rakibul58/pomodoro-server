import { z } from "zod";

const createSessionValidationSchema = z.object({
  body: z.object({
    duration: z.number().min(1).max(240),
  }),
});

export const FocusSessionValidations = {
  createSessionValidationSchema,
};