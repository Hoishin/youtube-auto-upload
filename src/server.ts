import fastify from "fastify";
import { googleAuth } from "./google-auth.js";
import { z } from "zod";
import { prisma } from "./prisma.js";
import { env } from "./env.js";
import { google } from "googleapis";
import { youtubeApi } from "./youtube-api.js";

export const startServer = async () => {
	const app = fastify();

	app.get("/auth", (_, reply) => {
		reply.redirect(
			googleAuth.generateAuthUrl({
				scope: ["https://www.googleapis.com/auth/youtube"],
				access_type: "offline",
				include_granted_scopes: true,
			})
		);
	});

	app.get("/callback", async (request, reply) => {
		const { code } = z.object({ code: z.string() }).parse(request.query);

		const { tokens } = await googleAuth.getToken(code);
		if (!tokens.refresh_token) {
			reply.status(500).send("Failed to get refresh token");
			return;
		}

		const tmpGoogleAuth = new google.auth.OAuth2({
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
		});
		tmpGoogleAuth.setCredentials(tokens);

		const { data: channels } = await youtubeApi.channels.list({
			auth: tmpGoogleAuth,
			part: ["id"],
			mine: true,
		});
		const channelId = channels.items?.[0]?.id;
		if (channelId !== env.YOUTUBE_CHANNEL_ID) {
			reply.status(400).send("Invalid channel");
			return;
		}

		await prisma.googleRefreshToken.create({
			data: { token: tokens.refresh_token },
		});
		googleAuth.setCredentials(tokens);

		console.log("Authenticated with Google");

		reply.send("OK");
	});

	await app.listen({ port: env.PORT });

	console.log(`server listening at http://localhost:${env.PORT}`);
};
