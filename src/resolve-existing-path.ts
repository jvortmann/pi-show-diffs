import { existsSync } from "node:fs";
import { homedir } from "node:os";
import * as path from "node:path";

// Matches the core agent's path-utils so previews resolve the same file the
// edit/write tools do: model-emitted paths can carry unicode spaces or NFD
// accents that must be normalized before checking existence.
const UNICODE_SPACES = /[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g;

function normalizeUnicodeSpaces(input: string): string {
	return input.replace(UNICODE_SPACES, " ");
}

function stripAtPrefix(input: string): string {
	return input.startsWith("@") ? input.slice(1) : input;
}

function expandTilde(input: string): string {
	if (input === "~") return homedir();
	if (input.startsWith("~/")) return path.join(homedir(), input.slice(2));
	return input;
}

function expandInputPath(input: string): string {
	return expandTilde(stripAtPrefix(normalizeUnicodeSpaces(input)));
}

const NARROW_NO_BREAK_SPACE = "\u202F";

function pathVariants(resolved: string): string[] {
	// macOS screenshots use a narrow no-break space before AM/PM.
	const amPm = resolved.replace(/ (AM|PM)\./gi, `${NARROW_NO_BREAK_SPACE}$1.`);
	// macOS stores filenames decomposed (NFD).
	const nfd = resolved.normalize("NFD");
	// macOS uses U+2019 (right single quote) where users type a straight apostrophe.
	const curly = resolved.replace(/'/g, "\u2019");
	const nfdCurly = nfd.replace(/'/g, "\u2019");
	return [amPm, nfd, curly, nfdCurly];
}

export function resolveExistingPath(
	inputPath: string,
	cwd: string,
	exists: (candidate: string) => boolean = existsSync,
): string {
	const expanded = expandInputPath(inputPath);
	const base = path.isAbsolute(expanded) ? expanded : path.resolve(cwd, expanded);
	if (exists(base)) return base;

	for (const variant of pathVariants(base)) {
		if (variant !== base && exists(variant)) return variant;
	}

	return base;
}
