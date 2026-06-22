import { z } from "zod";
import { env } from "../config/env.js";

export const usernameSchema = z
    .string()
    .trim()
    .transform((value) => value.replace(/^@/, ""))
    .refine((value) => /^(?!\.)(?!.*\.\.)(?!.*\.$)[A-Za-z0-9._]{1,30}$/.test(value), {
        message:
            "Username must contain only letters, numbers, dots, or underscores, without consecutive/trailing dots.",
    });

export const idSchema = z
    .string()
    .trim()
    .min(1, "ID is required.")
    .max(128, "ID is too long.")
    .regex(/^[A-Za-z0-9:_\-.]+$/, "ID contains unsupported characters.");

export const identifierSchema = z
    .string()
    .trim()
    .min(1, "Identifier is required.")
    .max(128, "Identifier is too long.")
    .regex(/^[A-Za-z0-9:_\-.@]+$/, "Identifier contains unsupported characters.");

export const paginationSchema = z.object({
    limit: z.coerce.number().int().min(1).max(env.maxLimit).default(env.defaultLimit),
    page: z.coerce.number().int().min(1).default(1),
    cursor: z.string().trim().max(256).optional(),
});

export const linkQuerySchema = z
    .object({
        link: z.string().trim().max(1000).optional(),
        url: z.string().trim().max(1000).optional(),
    })
    .refine((value) => value.link || value.url, {
        message: "Use query parameter link or url.",
    });

export const hashtagQuerySchema = paginationSchema.extend({
    hashtag: z.string().trim().min(1).max(128).optional(),
    tag: z.string().trim().min(1).max(128).optional(),
});
