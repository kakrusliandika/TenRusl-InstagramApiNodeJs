import { z } from "zod";
import { usernameSchema } from "./common.schema.js";

export const actionBodySchema = z
    .object({
        username: usernameSchema.optional(),
        dryRun: z.boolean().optional().default(true),
    })
    .passthrough();
