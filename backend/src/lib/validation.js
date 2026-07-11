import { z } from "zod";

export const signupSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  profilePic: z.string().url("Must be a valid URL").or(z.string().min(1, "Profile pic is required")),
});

export const sendMessageSchema = z.object({
  text: z.string().optional(),
  image: z.string().optional(),
  mediaType: z.enum(["image", "video", "audio"]).optional(),
  isEncrypted: z.boolean().optional(),
  encryptedKeys: z.record(z.string()).optional(),
}).refine((data) => data.text || data.image, {
  message: "Message must contain either text or media",
});
