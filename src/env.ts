import { z } from "zod";

const envSchema = z.object({
	TARGET_DIR: z.string(),
	GOOGLE_CLIENT_ID: z.string(),
	GOOGLE_CLIENT_SECRET: z.string(),
	YOUTUBE_CHANNEL_ID: z.string(),
	PORT: z.coerce.number().int(),
});

export const env = envSchema.parse(process.env);
