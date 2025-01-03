import { z } from "zod";

const createUserValidationSchema = z.object({
  body: z.object({
    password: z.string({
      required_error: "Password is required",
    }),
    user: z.object({
      name: z.string().optional(),
      email: z.string({
        required_error: "Email is required!",
      }),
      avatarUrl: z.string().optional(),
    }),
  }),
});

const updateUserValidation = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    avatarUrl: z.string().optional(),
  }),
});

export const UserValidations = {
  createUserValidationSchema,
  updateUserValidation
};
