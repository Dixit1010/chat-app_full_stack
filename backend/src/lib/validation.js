import { z } from "zod";

export const signupSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must not exceed 20 characters").regex(/^[a-z0-9_.]+$/, "Username can only contain lowercase letters, numbers, underscores, and periods"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  profilePic: z.string().url("Must be a valid URL").min(1, "Profile pic is required").optional(),
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must not exceed 20 characters").regex(/^[a-z0-9_.]+$/, "Username can only contain lowercase letters, numbers, underscores, and periods").optional(),
  about: z.string().max(150, "About section must not exceed 150 characters").optional(),
});

export const sendMessageSchema = z.object({
  text: z.string().optional(),
  image: z.string().optional(),
  mediaType: z.enum(["image", "video", "audio"]).optional(),
  isEncrypted: z.boolean().optional(),
  encryptedKeys: z.record(z.string()).optional(),
  replyTo: z.string().optional(),
  forwardedFrom: z.boolean().optional(),
}).refine((data) => data.text || data.image, {
  message: "Message must contain either text or media",
});

export const reportSchema = z.object({
  reportedUserId: z.string().min(1, "Reported user ID is required"),
  reason: z.enum(["spam", "harassment", "inappropriate", "other"]),
  messageId: z.string().optional(),
  details: z.string().max(500, "Details must not exceed 500 characters").optional(),
});
