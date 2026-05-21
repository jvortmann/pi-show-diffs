import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";

export type DiffColorMode = "default" | "theme";

export interface DiffApprovalConfig {
	autoApprove: boolean;
	diffColorMode: DiffColorMode;
	expandableLayout: boolean;
	collapsedHeight: string;
	expandedHeight: string;
	expandedWidth: string;
}

export const DEFAULT_CONFIG: DiffApprovalConfig = {
	autoApprove: false,
	diffColorMode: "default",
	expandableLayout: false,
	collapsedHeight: "30%",
	expandedHeight: "100%",
	expandedWidth: "100%",
};

export const CONFIG_PATH = join(getAgentDir(), "extensions", "pi-show-diffs.json");

function parseDiffColorMode(value: unknown): DiffColorMode {
	return value === "theme" ? "theme" : "default";
}

function formatPercent(value: number): string {
	return `${Number.isInteger(value) ? value : Number(value.toFixed(2))}%`;
}

function parsePercentConfig(value: unknown, fallback: string, min = 10, max = 100): string {
	if (typeof value !== "string") return fallback;
	const match = value.trim().match(/^(\d+(?:\.\d+)?)%$/);
	if (!match) return fallback;

	const percent = Number(match[1]);
	if (!Number.isFinite(percent)) return fallback;
	return formatPercent(Math.max(min, Math.min(percent, max)));
}

export function normalizeConfig(config: Partial<DiffApprovalConfig> = {}): DiffApprovalConfig {
	return {
		autoApprove: config.autoApprove === true,
		diffColorMode: parseDiffColorMode(config.diffColorMode),
		expandableLayout: config.expandableLayout === true,
		collapsedHeight: parsePercentConfig(config.collapsedHeight, DEFAULT_CONFIG.collapsedHeight),
		expandedHeight: parsePercentConfig(config.expandedHeight, DEFAULT_CONFIG.expandedHeight),
		expandedWidth: parsePercentConfig(config.expandedWidth, DEFAULT_CONFIG.expandedWidth),
	};
}

export function loadConfig(): DiffApprovalConfig {
	try {
		const raw = readFileSync(CONFIG_PATH, "utf-8");
		return normalizeConfig(JSON.parse(raw) as Partial<DiffApprovalConfig>);
	} catch {
		return { ...DEFAULT_CONFIG };
	}
}

export function saveConfig(config: DiffApprovalConfig): void {
	const normalized = normalizeConfig(config);
	mkdirSync(dirname(CONFIG_PATH), { recursive: true });
	writeFileSync(CONFIG_PATH, `${JSON.stringify(normalized, null, 2)}\n`, "utf-8");
}
