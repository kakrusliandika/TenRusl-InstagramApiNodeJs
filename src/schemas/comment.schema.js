import { z } from "zod";

export const commentReplyBodySchema = z
    .object({
        id: z.string().trim().min(1).max(128).optional(),
        link: z.string().trim().max(1000).optional(),
        text: z.string().trim().min(1).max(2000),
        dryRun: z.boolean().optional().default(true),
    })
    .passthrough();
