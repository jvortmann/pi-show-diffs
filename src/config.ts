import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";

export type DiffColorMode = "default" | "theme";

export interface DiffApprovalConfig {
	autoApprove: boolean;
	diffColorMode: DiffColorMode;
}

export const DEFAULT_CONFIG: DiffApprovalConfig = {
	autoApprove: false,
	diffColorMode: "default",
};

function parseDiffColorMode(value: unknown): DiffColorMode {
	return value === "theme" ? "theme" : "default";
}

export const CONFIG_PATH = join(getAgentDir(), "extensions", "pi-show-diffs.json");

export function loadConfig(): DiffApprovalConfig {
	try {
		const raw = readFileSync(CONFIG_PATH, "utf-8");
		const parsed = JSON.parse(raw) as Partial<DiffApprovalConfig>;
		return {
			autoApprove: parsed.autoApprove === true,
			diffColorMode: parseDiffColorMode(parsed.diffColorMode),
		};
	} catch {
		return { ...DEFAULT_CONFIG };
	}
}

export function saveConfig(config: DiffApprovalConfig): void {
	mkdirSync(dirname(CONFIG_PATH), { recursive: true });
	writeFileSync(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf-8");
}
