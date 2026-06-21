import { z } from "zod";
import { usernameSchema } from "./common.schema.js";

export const messageBodySchema = z
    .object({
        recipientId: z.string().trim().min(1).max(128).optional(),
        username: usernameSchema.optional(),
        text: z.string().trim().min(1).max(2000),
        dryRun: z.boolean().optional().default(true),
    })
    .refine((value) => value.recipientId || value.username, {
        message: "recipientId or username is required.",
    });

export const commentReplyBodySchema = z
    .object({
        id: z.string().trim().min(1).max(128).optional(),
        link: z.string().trim().max(1000).optional(),
        text: z.string().trim().min(1).max(2000),
        dryRun: z.boolean().optional().default(true),
    })
    .passthrough();
