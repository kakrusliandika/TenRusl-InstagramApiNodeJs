import { z } from "zod";
import { paginationSchema, queryBoolean } from "./common.schema.js";

export const mediaTypeSchema = z.enum(["IMAGE", "VIDEO", "CAROUSEL", "REEL", "STORY", "FEED"]).default("IMAGE");

export const publishBodySchema = z
    .object({
        caption: z.string().trim().max(2200).optional().default(""),
        mediaUrl: z.string().url("mediaUrl must be a valid URL."),
        mediaType: mediaTypeSchema,
        dryRun: z.boolean().optional().default(true),
    })
    .strict();

export const collectionQuerySchema = paginationSchema.extend({
    all: queryBoolean,
});
