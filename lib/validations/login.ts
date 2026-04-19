import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Introduce el correo").email("Correo no válido"),
  password: z.string().min(1, "Introduce la contraseña"),
});

export type LoginInput = z.infer<typeof loginSchema>;
