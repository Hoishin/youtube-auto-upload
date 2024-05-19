import { google } from "googleapis";
import { env } from "./env.js";
import { prisma } from "./prisma.js";

const refreshToken = await prisma.googleRefreshToken.findFirst({
	orderBy: { createdAt: "desc" },
	select: { token: true },
});

export const googleAuth = new google.auth.OAuth2({
	clientId: env.GOOGLE_CLIENT_ID,
	clientSecret: env.GOOGLE_CLIENT_SECRET,
	redirectUri: `http://localhost:${env.PORT}/callback`,
});

if (refreshToken) {
	googleAuth.setCredentials({ refresh_token: refreshToken.token });
}

googleAuth.on("tokens", async (tokens) => {
	if (tokens.refresh_token) {
		await prisma.googleRefreshToken.create({
			data: { token: tokens.refresh_token },
		});
	}
});
