import { z } from "zod";

export const authRoleSchema = z.enum(["USER", "ADMIN"]);

export const authUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1),
  role: authRoleSchema,
});

export const authUserResponseSchema = z.object({
  data: z.object({
    user: authUserSchema,
  }),
});

export const apiErrorDetailSchema = z.object({
  path: z.string(),
  message: z.string(),
});

export const apiErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(apiErrorDetailSchema),
  }),
});

export const loginRequestSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email(),
  password: z.string().min(1).max(200),
});

export type AuthRole = z.infer<typeof authRoleSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthUserResponse = z.infer<typeof authUserResponseSchema>;
export type ApiErrorDetail = z.infer<typeof apiErrorDetailSchema>;
export type ApiErrorEnvelope = z.infer<typeof apiErrorEnvelopeSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
