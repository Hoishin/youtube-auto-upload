import { setInterval } from "node:timers/promises";
import fs from "node:fs/promises";

const MAX_STABLE_COUNT = 10;
const CHECK_INTERVAL = 1000;

export const waitFile = async (path: string) => {
	let lastSize = 0;
	let stableCounter = 0;

	for await (const _ of setInterval(CHECK_INTERVAL)) {
		const stat = await fs.stat(path);
		if (stat.size === lastSize) {
			stableCounter += 1;
			if (stableCounter >= MAX_STABLE_COUNT) {
				break;
			}
		} else {
			lastSize = stat.size;
			stableCounter = 0;
		}
	}
};
