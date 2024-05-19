import chokidar from "chokidar";
import { startServer } from "./server.js";
import { env } from "./env.js";
import path from "node:path";
import { waitFile } from "./wait-file.js";
import { youtubeApi } from "./youtube-api.js";
import fs from "node:fs";
import { googleAuth } from "./google-auth.js";

await startServer();

const watcher = chokidar.watch(env.TARGET_DIR, {
	persistent: true,
	ignoreInitial: true,
});

watcher.on("add", async (filePath) => {
	try {
		console.log(`File ${filePath}: added`);

		if (path.extname(filePath) !== ".mkv") {
			console.log("File is not an mkv file, skipping");
			return;
		}

		await waitFile(filePath);

		console.log(`File ${filePath}: starting upload`);
		const fileStream = fs.createReadStream(filePath);
		await youtubeApi.videos.insert({
			auth: googleAuth,
			part: ["snippet", "status"],
			requestBody: {
				snippet: {
					title: path.basename(filePath),
					description: "Uploaded by script",
					categoryId: "20",
				},
				status: { privacyStatus: "unlisted" },
			},
			media: { body: fileStream },
		});

		console.log(`File ${filePath}: upload complete`);
	} catch (error) {
		console.log(
			`File ${filePath}: failed to upload file`,
			(error as Error).message
		);
	}
});
