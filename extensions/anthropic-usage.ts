/**
 * /usage - show current Anthropic (Claude subscription) usage as ANSI art.
 *
 * Reads the Anthropic OAuth access token from ~/.pi/agent/auth.json and
 * queries https://api.anthropic.com/api/oauth/usage (+ /profile for plan).
 *
 * Note: the API's `utilization` field is already a percentage
 * (1.0 means 1%, not 100%).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Box, Text } from "@earendil-works/pi-tui";

const home = process.env.HOME ?? "";
const authPath = join(home, ".pi/agent/auth.json");

const BAR_WIDTH = 28;
// Eighth-block characters for sub-cell precision (index 0 = empty).
const PARTIALS = ["", "▏", "▎", "▍", "▌", "▋", "▊", "▉"];

interface UsageWindow {
	utilization: number;
	resets_at: string | null;
}

interface UsageResponse {
	five_hour?: UsageWindow | null;
	seven_day?: UsageWindow | null;
	seven_day_sonnet?: UsageWindow | null;
	seven_day_opus?: UsageWindow | null;
}

interface Projection {
	label: string;
	ratePctPerHour: number;
	hoursToCap: number; // Infinity if rate <= 0
	hoursToReset: number | null;
	projectedAtReset: number | null; // utilization % projected at reset time
	willHitCap: boolean;
}

interface UsageDetails {
	rows: Array<{ label: string; pct: number | null; reset: string | null }>;
	plan: string | null;
	email: string | null;
	projections: Projection[];
	sessionElapsedH: number | null;
	projectionNote: string | null;
}

// ---- Session burn-rate sampling -------------------------------------------
// In-memory samples for the life of the pi process (= current session).
// Each sample records utilization (%) per window at a wall-clock time.
type Sample = { ts: number; vals: Record<string, number> };
const samples: Sample[] = [];
const MAX_SAMPLES = 200;
const MIN_ELAPSED_H = 60 / 3600; // 60s; below this a rate is too noisy.

// Map display labels to response window keys, in display order.
const WINDOW_KEYS: Array<{ label: string; key: keyof UsageResponse }> = [
	{ label: "5-hour", key: "five_hour" },
	{ label: "7-day", key: "seven_day" },
	{ label: "Sonnet 7d", key: "seven_day_sonnet" },
	{ label: "Opus 7d", key: "seven_day_opus" },
];

function recordSample(usage: UsageResponse): void {
	const vals: Record<string, number> = {};
	for (const { label, key } of WINDOW_KEYS) {
		const w = usage[key] as UsageWindow | null | undefined;
		if (w && typeof w.utilization === "number") vals[label] = w.utilization;
	}
	if (Object.keys(vals).length === 0) return;
	samples.push({ ts: Date.now(), vals });
	if (samples.length > MAX_SAMPLES) samples.splice(0, samples.length - MAX_SAMPLES);
}

// Compute the session burn rate for one window. Restarts the segment whenever
// utilization drops (window reset), so we only measure the current period.
function computeProjection(
	label: string,
	currentPct: number,
	resetIso: string | null,
): Projection | null {
	const points = samples
		.filter((s) => typeof s.vals[label] === "number")
		.map((s) => ({ ts: s.ts, val: s.vals[label] }));
	if (points.length < 2) return null;

	// Keep only the current monotonic-ish segment: drop everything up to the
	// last point where utilization decreased (a window reset boundary).
	let segStartIdx = 0;
	for (let i = 1; i < points.length; i++) {
		if (points[i].val < points[i - 1].val) segStartIdx = i;
	}
	const seg = points.slice(segStartIdx);
	if (seg.length < 2) return null;

	const first = seg[0];
	const last = seg[seg.length - 1];
	const elapsedH = (last.ts - first.ts) / 3600000;
	if (elapsedH < MIN_ELAPSED_H) return null;

	const deltaPct = last.val - first.val;
	const ratePctPerHour = deltaPct / elapsedH;
	const remainingPct = Math.max(0, 100 - currentPct);
	const hoursToCap = ratePctPerHour > 0 ? remainingPct / ratePctPerHour : Number.POSITIVE_INFINITY;

	let hoursToReset: number | null = null;
	if (resetIso) {
		const ms = new Date(resetIso).getTime() - Date.now();
		if (!Number.isNaN(ms)) hoursToReset = Math.max(0, ms / 3600000);
	}

	let projectedAtReset: number | null = null;
	if (hoursToReset !== null) {
		projectedAtReset = Math.max(0, currentPct + ratePctPerHour * hoursToReset);
	}

	const willHitCap =
		Number.isFinite(hoursToCap) && hoursToReset !== null && hoursToCap < hoursToReset;

	return { label, ratePctPerHour, hoursToCap, hoursToReset, projectedAtReset, willHitCap };
}

function readAnthropicToken(): { access: string; expired: boolean } | null {
	try {
		const auth = JSON.parse(readFileSync(authPath, "utf8"));
		const a = auth?.anthropic;
		if (!a?.access) return null;
		const expired = typeof a.expires === "number" && a.expires < Date.now();
		return { access: a.access, expired };
	} catch {
		return null;
	}
}

function relativeReset(iso: string | null): string | null {
	if (!iso) return null;
	const ms = new Date(iso).getTime() - Date.now();
	if (Number.isNaN(ms)) return null;
	if (ms <= 0) return "now";
	const mins = Math.round(ms / 60000);
	if (mins < 60) return `in ${mins}m`;
	const hrs = Math.floor(mins / 60);
	const rem = mins % 60;
	if (hrs < 24) return rem ? `in ${hrs}h ${rem}m` : `in ${hrs}h`;
	const days = Math.floor(hrs / 24);
	return `in ${days}d ${hrs % 24}h`;
}

function fmtDuration(hours: number): string {
	if (!Number.isFinite(hours)) return "\u221e"; // ∞
	const mins = Math.round(hours * 60);
	if (mins < 60) return `${mins}m`;
	const h = Math.floor(mins / 60);
	const m = mins % 60;
	if (h < 24) return m ? `${h}h ${m}m` : `${h}h`;
	const d = Math.floor(h / 24);
	return `${d}d ${h % 24}h`;
}

function pctColor(pct: number): "success" | "warning" | "error" {
	if (pct >= 80) return "error";
	if (pct >= 50) return "warning";
	return "success";
}

// theme.fg is intentionally loosely typed here; the runtime accepts these keys.
type Fg = (key: string, text: string) => string;

function renderBar(pct: number, fg: Fg): string {
	const frac = Math.max(0, Math.min(1, pct / 100));
	const exact = frac * BAR_WIDTH;
	const full = Math.floor(exact);
	const partialIdx = Math.round((exact - full) * 8);
	// Carry over if rounding pushed the partial to a full block.
	const fullBlocks = partialIdx === 8 ? full + 1 : full;
	const partial = partialIdx === 8 ? "" : PARTIALS[partialIdx];
	const filled = "█".repeat(fullBlocks) + partial;
	const used = fullBlocks + (partial ? 1 : 0);
	const empty = "░".repeat(Math.max(0, BAR_WIDTH - used));
	const color = pctColor(pct);
	return fg(color, filled) + fg("dim", empty);
}

function renderUsage(details: UsageDetails, fg: Fg, bold: (t: string) => string): string {
	const title = fg("toolTitle", bold("Anthropic Usage"));
	const subParts: string[] = [];
	if (details.plan) subParts.push(details.plan);
	if (details.email) subParts.push(details.email);
	const sub = subParts.length ? fg("dim", subParts.join("  ·  ")) : "";

	const labelWidth = Math.max(...details.rows.map((r) => r.label.length));
	const lines = details.rows.map((r) => {
		const label = fg("muted", r.label.padEnd(labelWidth));
		if (r.pct === null) {
			return `${label}  ${fg("dim", "n/a")}`;
		}
		const bar = renderBar(r.pct, fg);
		const pctText = fg(pctColor(r.pct), `${r.pct}%`.padStart(4));
		const reset = relativeReset(r.reset);
		const resetText = reset ? fg("dim", `  resets ${reset}`) : "";
		return `${label}  ${bar}  ${pctText}${resetText}`;
	});

	const header = sub ? `${title}\n${sub}\n` : `${title}\n`;
	let out = `${header}\n${lines.join("\n")}`;

	// Burn-rate projection section.
	if (details.projections.length > 0) {
		const elapsed =
			details.sessionElapsedH !== null ? ` (this session, ${fmtDuration(details.sessionElapsedH)})` : "";
		const projTitle = fg("toolTitle", bold("Projected burn")) + fg("dim", elapsed);
		const projLines = details.projections.map((p) => {
			const label = fg("muted", p.label.padEnd(labelWidth));
			const rate = fg("dim", `${p.ratePctPerHour >= 0 ? "+" : ""}${p.ratePctPerHour.toFixed(1)}%/h`);
			if (p.ratePctPerHour <= 0) {
				return `${label}  ${rate}  ${fg("success", "steady")}`;
			}
			if (p.willHitCap) {
				const eta = fg("error", `cap in ${fmtDuration(p.hoursToCap)}`);
				const before = p.hoursToReset !== null ? fg("dim", ` (resets in ${fmtDuration(p.hoursToReset)})`) : "";
				return `${label}  ${rate}  ${eta}${before}`;
			}
			// Won't hit cap before reset: show projected utilization at reset.
			if (p.projectedAtReset !== null) {
				const proj = fg("success", `~${Math.round(p.projectedAtReset)}% by reset`);
				return `${label}  ${rate}  ${proj}`;
			}
			return `${label}  ${rate}  ${fg("dim", `cap in ${fmtDuration(p.hoursToCap)}`)}`;
		});
		out += `\n\n${projTitle}\n${projLines.join("\n")}`;
	} else if (details.projectionNote) {
		out += `\n\n${fg("dim", details.projectionNote)}`;
	}

	return out;
}

// Fetch the usage payload and record a burn-rate sample. Returns null on failure.
async function fetchUsageResponse(signal?: AbortSignal): Promise<UsageResponse | null> {
	const token = readAnthropicToken();
	if (!token || token.expired) return null;
	try {
		const res = await fetch("https://api.anthropic.com/api/oauth/usage", {
			headers: {
				Authorization: `Bearer ${token.access}`,
				"anthropic-beta": "oauth-2025-04-20",
			},
			signal,
		});
		if (!res.ok) return null;
		const usage = (await res.json()) as UsageResponse;
		recordSample(usage);
		return usage;
	} catch {
		return null;
	}
}

export default function (pi: ExtensionAPI) {
	// Seed a baseline sample at session start so the first /usage call within a
	// session can already show a (rough) burn rate.
	pi.on("session_start", async () => {
		await fetchUsageResponse();
	});

	pi.registerMessageRenderer<UsageDetails>("anthropic-usage", (message, _opts, theme) => {
		const fg = theme.fg.bind(theme) as unknown as Fg;
		const box = new Box(1, 1, (t) => theme.bg("customMessageBg", t));
		box.addChild(new Text(renderUsage(message.details as UsageDetails, fg, theme.bold.bind(theme)), 0, 0));
		return box;
	});

	pi.registerCommand("usage", {
		description: "Show current Anthropic subscription usage (ANSI art)",
		handler: async (_args, ctx) => {
			const token = readAnthropicToken();
			if (!token) {
				ctx.ui.notify("No Anthropic OAuth token found in ~/.pi/agent/auth.json", "error");
				return;
			}
			if (token.expired) {
				ctx.ui.notify("Anthropic token is expired; run a prompt to refresh it, then retry /usage", "warning");
				return;
			}

			const headers = {
				Authorization: `Bearer ${token.access}`,
				"anthropic-beta": "oauth-2025-04-20",
			};

			ctx.ui.setStatus("usage", "Fetching usage...");
			try {
				const [usageRes, profileRes] = await Promise.all([
					fetch("https://api.anthropic.com/api/oauth/usage", { headers, signal: ctx.signal }),
					fetch("https://api.anthropic.com/api/oauth/profile", { headers, signal: ctx.signal }).catch(
						() => null,
					),
				]);

				if (!usageRes.ok) {
					ctx.ui.notify(`Usage request failed: ${usageRes.status} ${usageRes.statusText}`, "error");
					return;
				}
				const usage = (await usageRes.json()) as UsageResponse;
				recordSample(usage);

				let plan: string | null = null;
				let email: string | null = null;
				if (profileRes?.ok) {
					const profile = (await profileRes.json()) as {
						account?: { email?: string };
						organization?: { rate_limit_tier?: string };
					};
					email = profile.account?.email ?? null;
					const tier = profile.organization?.rate_limit_tier ?? "";
					if (tier.includes("max_20x")) plan = "Max (20x)";
					else if (tier.includes("max_5x")) plan = "Max (5x)";
					else if (tier.includes("max")) plan = "Max";
					else if (tier.includes("pro")) plan = "Pro";
					else if (tier) plan = tier;
				}

				const win = (w: UsageWindow | null | undefined): { pct: number | null; reset: string | null } =>
					w ? { pct: w.utilization, reset: w.resets_at } : { pct: null, reset: null };

				const rows = [
					{ label: "5-hour", ...win(usage.five_hour) },
					{ label: "7-day", ...win(usage.seven_day) },
					{ label: "Sonnet 7d", ...win(usage.seven_day_sonnet) },
					...(usage.seven_day_opus
						? [{ label: "Opus 7d", ...win(usage.seven_day_opus) }]
						: []),
				];

				// Build burn-rate projections from session samples.
				const projections: Projection[] = [];
				for (const r of rows) {
					if (r.pct === null) continue;
					const p = computeProjection(r.label, r.pct, r.reset);
					if (p) projections.push(p);
				}
				const sessionElapsedH =
					samples.length >= 2 ? (samples[samples.length - 1].ts - samples[0].ts) / 3600000 : null;
				const projectionNote =
					projections.length === 0
						? "Burn rate needs another /usage sample later this session."
						: null;

				const details: UsageDetails = {
					plan,
					email,
					rows,
					projections,
					sessionElapsedH,
					projectionNote,
				};

				pi.sendMessage({
					customType: "anthropic-usage",
					content: "Anthropic usage",
					display: true,
					details,
				});
			} catch (err) {
				ctx.ui.notify(
					`Usage request error: ${err instanceof Error ? err.message : String(err)}`,
					"error",
				);
			} finally {
				ctx.ui.setStatus("usage", undefined);
			}
		},
	});
}
