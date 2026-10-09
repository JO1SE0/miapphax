// panel.ts
// Barra lateral con paneles de personalizacion: Aspecto, Rendimiento, Cancha, Extras y Ajustes.
// F9 la muestra / oculta. Por defecto se oculta sola dentro de una sala.

import { getLinesConfig, updateLinesLive } from "./lines";
import type { LinesConfig } from "./lines";
import { BRAND_LOGO } from "./brand";
import { getFx, playStartupSound, showGoal, updateFx } from "./fx";
import { getExtras, getFavoriteRooms, getTeamPresent, joinRoomByName, playSound, rejoinLastRoom, sendChat, showToast, updateExtras } from "./extras";
import { refreshBackground, setBackgroundPerformanceMode } from "./bg";
import { openSettingsAlert } from "./settings";
import { CLUB_THEME, PRESETS, getThemeConfig, isValidHex, updateThemeLive } from "./theme";
import { copyToClipboard, dumpUiStructure } from "./uidump";

const STYLE_ID = "hax-panel-style";
const ROOT_ID = "hax-panel-root";
const WIDTH = 72;

type SectionId = "look" | "perf" | "pitch" | "extras" | "settings";

const ICONS: Record<SectionId, string> = {
	look: '<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10" r="1.2"/><circle cx="12" cy="7.5" r="1.2"/><circle cx="15.5" cy="10" r="1.2"/><path d="M12 21c-1.5 0-2-1.2-1.4-2.3.6-1 .2-2.2-1-2.2H8"/>',
	perf: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
	pitch: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 5v14"/><circle cx="12" cy="12" r="3"/>',
	extras: '<path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
	settings: '<path d="M4 6h8m4 0h4M4 12h2m4 0h10M4 18h10m4 0h2"/><circle cx="14" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
};

const SECTIONS: { id: SectionId; label: string; title: string }[] = [
	{ id: "look", label: "Aspecto", title: "Aspecto" },
	{ id: "perf", label: "Rendim.", title: "Rendimiento" },
	{ id: "pitch", label: "Cancha", title: "Cancha y lineas" },
	{ id: "extras", label: "Extras", title: "Chat, equipo y salas" },
	{ id: "settings", label: "Ajustes", title: "Ajustes" },
];

const CSS = `
#${ROOT_ID} { position: fixed; top: var(--hx-panel-top, 0px); left: 0; right: 0; bottom: 0; z-index: 2147483000; font-family: inherit; color: #e6e9ee; pointer-events: none; }
#${ROOT_ID} .hx-hot { position: absolute; top: 0; left: 0; bottom: 0; width: 8px; z-index: 1; pointer-events: auto; }
#${ROOT_ID}.hx-open .hx-hot, #${ROOT_ID}.hx-nohot .hx-hot { display: none; }
#${ROOT_ID} .hx-logo { display: none; width: 46px; height: 46px; margin-bottom: 6px; border-radius: 12px; background: center / contain no-repeat; flex: 0 0 auto; }
#${ROOT_ID} .hx-logo.on { display: block; }
#${ROOT_ID} .hx-logo-preview { width: 52px; height: 52px; border-radius: 12px; background: rgba(255,255,255,.05) center / contain no-repeat; }
#${ROOT_ID}:not(.hx-open) .hx-drawer { opacity: 0 !important; pointer-events: none !important; transform: translateX(-12px) !important; }
#${ROOT_ID} .hx-bar { position: absolute; top: 8px; left: 0; bottom: 12px; width: ${WIDTH}px; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 0; box-sizing: border-box; background: rgba(10,12,16,.9); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,.09); border-left: 0; border-radius: 0 16px 16px 0; box-shadow: 0 12px 36px rgba(0,0,0,.3); transform: translateX(-100%); transition: transform .18s ease; pointer-events: none; }
#${ROOT_ID}.hx-open .hx-bar { transform: none; pointer-events: auto; }
#${ROOT_ID} .hx-nav { width: 56px; padding: 8px 0 6px; display: flex; flex-direction: column; align-items: center; gap: 4px; background: transparent !important; border: 1px solid transparent !important; color: #9aa3b2 !important; cursor: pointer; font-size: 10px; font-weight: 600; }
#${ROOT_ID} .hx-nav:hover { color: #fff !important; background: rgba(255,255,255,.06) !important; }
#${ROOT_ID} .hx-nav.on { color: #fff !important; background: var(--hx-accent-soft, rgba(59,130,246,.3)) !important; border-color: var(--hx-accent, #3b82f6) !important; }
#${ROOT_ID} .hx-nav svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
#${ROOT_ID} .hx-spacer { flex: 1; }
#${ROOT_ID} .hx-drawer { position: absolute; top: 8px; left: ${WIDTH + 8}px; bottom: 12px; width: min(340px, calc(100vw - ${WIDTH + 32}px)); padding: 18px 18px 24px; overflow-y: auto; box-sizing: border-box; background: rgba(13,16,21,.96); backdrop-filter: blur(18px); border: 1px solid rgba(255,255,255,.09); border-radius: 16px; box-shadow: 8px 12px 36px rgba(0,0,0,.38); transform: translateX(-12px); opacity: 0; pointer-events: none; transition: transform .18s ease, opacity .18s ease; }
#${ROOT_ID} .hx-drawer.open { transform: none; opacity: 1; pointer-events: auto; }
#${ROOT_ID} h2 { margin: 0 0 4px; font-size: 18px; color: #fff; }
#${ROOT_ID} .hx-sub { margin: 0 0 16px; font-size: 12px; color: #8b94a3; line-height: 1.4; }
#${ROOT_ID} .hx-group { margin: 18px 0 8px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #8b94a3; font-weight: 700; }
#${ROOT_ID} .hx-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 9px 0; border-bottom: 1px solid rgba(255,255,255,.05); }
#${ROOT_ID} .hx-label { font-size: 13px; font-weight: 600; color: #e6e9ee; }
#${ROOT_ID} .hx-hint { display: block; margin-top: 2px; font-size: 11px; font-weight: 400; color: #8b94a3; line-height: 1.3; }
#${ROOT_ID} .hx-tag { display: inline-block; margin-left: 6px; padding: 1px 6px; font-size: 10px; border-radius: 6px; background: rgba(255,255,255,.08); color: #b7bfcc; font-weight: 600; }
#${ROOT_ID} .hx-switch { position: relative; flex: 0 0 auto; width: 38px; height: 22px; }
#${ROOT_ID} .hx-switch input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; z-index: 1; }
#${ROOT_ID} .hx-switch span { position: absolute; inset: 0; border-radius: 22px; background: rgba(255,255,255,.14); transition: background .15s; pointer-events: none; }
#${ROOT_ID} .hx-switch span::after { content: ""; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: transform .15s; }
#${ROOT_ID} .hx-switch input:checked + span { background: var(--hx-accent, #3b82f6); }
#${ROOT_ID} .hx-switch input:checked + span::after { transform: translateX(16px); }
#${ROOT_ID} .hx-slider { display: flex; align-items: center; gap: 10px; flex: 0 0 160px; }
#${ROOT_ID} .hx-slider input { flex: 1; min-width: 0; accent-color: var(--hx-accent, #3b82f6); }
#${ROOT_ID} .hx-val { flex: 0 0 38px; text-align: right; font-size: 12px; color: #b7bfcc; font-variant-numeric: tabular-nums; }
#${ROOT_ID} .hx-select { min-width: 112px; padding: 7px 9px; color: #e6e9ee; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); border-radius: 8px; }
#${ROOT_ID} .hx-swatches { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: flex-end; max-width: 170px; }
#${ROOT_ID} .hx-dot { width: 24px; height: 24px; padding: 0 !important; border-radius: 50% !important; border: none !important; cursor: pointer; outline: 2px solid transparent; outline-offset: 2px; }
#${ROOT_ID} .hx-dot.on { outline-color: #fff; }
#${ROOT_ID} input[type=color] { width: 32px; height: 26px; padding: 0; border: none; background: none; cursor: pointer; }
#${ROOT_ID} .hx-btn { padding: 8px 12px; font-size: 13px; font-weight: 600; color: #fff; background: var(--hx-accent, #3b82f6); border: none; cursor: pointer; }
#${ROOT_ID} .hx-btn:hover { background: var(--hx-accent-hover, #5b9bf8); }
#${ROOT_ID} .hx-btn.ghost { background: rgba(255,255,255,.08); }
#${ROOT_ID} .hx-btn.ghost:hover { background: rgba(255,255,255,.14); }
#${ROOT_ID} .hx-seg { display: flex; flex: 0 0 auto; padding: 2px; gap: 2px; border-radius: 10px; background: rgba(255,255,255,.06); }
#${ROOT_ID} .hx-seg button { padding: 5px 10px; font-size: 12px; font-weight: 600; color: #b7bfcc !important; background: transparent !important; border: none !important; cursor: pointer; }
#${ROOT_ID} .hx-seg button.on { color: #fff !important; background: var(--hx-accent, #3b82f6) !important; }
#${ROOT_ID} .hx-presets { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 8px 0 14px; }
#${ROOT_ID} .hx-preset { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; text-align: left; min-height: 58px; }
#${ROOT_ID} .hx-preset small { color: #9aa3b2; font-size: 10px; font-weight: 400; line-height: 1.3; }
#${ROOT_ID} .hx-banner { margin-top: 16px; padding: 10px 12px; font-size: 12px; line-height: 1.4; border-radius: 8px; background: rgba(250,170,60,.12); border: 1px solid rgba(250,170,60,.35); color: #f5c27a; }
#${ROOT_ID} .hx-banner .hx-btn { margin-top: 8px; width: 100%; }
@media (max-height: 680px) {
	#${ROOT_ID} .hx-bar { top: 8px; bottom: 8px; padding: 8px 0; gap: 2px; }
	#${ROOT_ID} .hx-drawer { top: 8px; bottom: 8px; padding: 14px 14px 18px; }
}
`;

const SAVE = (key: string, value: any): void => {
	try { window.electronAPI.setAppPreference(key, value); } catch { /* sin preload */ }
};

const VISUAL_PREF_KEYS = [
	"theme_enabled", "theme_cards", "theme_card_style", "theme_density",
	"theme_accent", "theme_accent2", "theme_glow", "theme_glow_strength", "theme_radius", "ui_blur",
	"club_logo",
	"bg_enabled", "bg_from", "bg_to", "bg_anim", "bg_crest",
	"lines_enabled", "line_width_field", "line_width_ball", "line_width_players",
	"pitch_flat", "pitch_flat_color", "vis_enabled", "vis_my_scale", "vis_ball_scale",
	"vis_ball_color", "vis_ball_trail", "wm_enabled", "wm_opacity", "wm_size",
	"assist_shot_angles", "assist_pass_lines", "assist_ball_distance",
	"assist_blocked_shot", "assist_team_mode", "assist_attack_direction",
	"fx_enabled", "fx_banner", "fx_cinematic", "fx_edge", "fx_splash", "fx_splash_sound", "fx_red_color", "fx_blue_color",
	"fps_mode",
] as const;

type VisualPrefKey = typeof VISUAL_PREF_KEYS[number];
type VisualPrefValue = string | number | boolean;
type VisualSnapshot = Partial<Record<VisualPrefKey, VisualPrefValue>>;

const VISUAL_PRESETS: { name: string; hint: string; values: VisualSnapshot }[] = [
	{
		name: "Competitivo",
		hint: "Interfaz solida y efectos de cancha reducidos.",
		values: {
			theme_enabled: true, theme_cards: true, theme_card_style: "solid", theme_density: 0.9,
			theme_accent: "#2d4f8a", theme_accent2: "#d0b878", theme_glow: "", theme_glow_strength: 0.1,
			theme_radius: 10, ui_blur: false, bg_enabled: true, bg_from: "#203860", bg_to: "#08101f",
			bg_anim: false, bg_crest: false, lines_enabled: true, line_width_field: 1.5,
			line_width_ball: 1, line_width_players: 1, pitch_flat: false, pitch_flat_color: "",
			vis_enabled: true, vis_my_scale: 1, vis_ball_scale: 1, vis_ball_color: "", vis_ball_trail: false,
			wm_enabled: false, wm_opacity: 0.12, wm_size: 160, assist_shot_angles: false,
			assist_pass_lines: false, assist_ball_distance: false,
			assist_blocked_shot: false, assist_team_mode: "auto", assist_attack_direction: "auto",
			fx_enabled: true, fx_banner: true,
			fx_cinematic: false, fx_edge: false, fx_splash: false, fx_splash_sound: false, fx_red_color: "#e56e56",
			fx_blue_color: "#5689e5", fps_mode: false,
		},
	},
	{
		name: "Clasico",
		hint: "Aspecto original y sin efectos agregados.",
		values: {
			theme_enabled: false, theme_cards: false, theme_card_style: "flat", theme_density: 1,
			theme_accent: "#2d4f8a", theme_accent2: "#d0b878", theme_glow: "", theme_glow_strength: 0,
			theme_radius: 8, ui_blur: false, bg_enabled: false, bg_from: "#203860", bg_to: "#08101f",
			bg_anim: false, bg_crest: false, lines_enabled: false, line_width_field: 3,
			line_width_ball: 2, line_width_players: 2, pitch_flat: false, pitch_flat_color: "",
			vis_enabled: false, vis_my_scale: 1, vis_ball_scale: 1, vis_ball_color: "", vis_ball_trail: false,
			wm_enabled: false, wm_opacity: 0.12, wm_size: 160, assist_shot_angles: false,
			assist_pass_lines: false, assist_ball_distance: false,
			assist_blocked_shot: false, assist_team_mode: "auto", assist_attack_direction: "auto",
			fx_enabled: false, fx_banner: false,
			fx_cinematic: false, fx_edge: false, fx_splash: false, fx_splash_sound: false, fx_red_color: "#e56e56",
			fx_blue_color: "#5689e5", fps_mode: false,
		},
	},
	{
		name: "Festivo",
		hint: "Colores vivos y celebracion de gol mas marcada.",
		values: {
			theme_enabled: true, theme_cards: true, theme_card_style: "glass", theme_density: 1,
			theme_accent: "#ec4899", theme_accent2: "#06b6d4", theme_glow: "#ec4899",
			theme_glow_strength: 0.45, theme_radius: 14, ui_blur: true, bg_enabled: true,
			bg_from: "#4a1942", bg_to: "#101a40", bg_anim: false, bg_crest: true,
			lines_enabled: true, line_width_field: 1.5, line_width_ball: 1, line_width_players: 1,
			pitch_flat: false, pitch_flat_color: "", vis_enabled: true, vis_my_scale: 1,
			vis_ball_scale: 1, vis_ball_color: "", vis_ball_trail: true, wm_enabled: false,
			assist_shot_angles: false, assist_pass_lines: false,
			assist_ball_distance: false, assist_blocked_shot: false, assist_team_mode: "auto",
			assist_attack_direction: "auto",
			wm_opacity: 0.12, wm_size: 160, fx_enabled: true, fx_banner: true, fx_cinematic: true,
			fx_edge: true, fx_splash: true, fx_splash_sound: true, fx_red_color: "#ff5277", fx_blue_color: "#41c8ff",
			fps_mode: false,
		},
	},
];

const isVisualSnapshot = (value: unknown): value is VisualSnapshot =>
	!!value && typeof value === "object" && !Array.isArray(value) &&
	Object.keys(value).every((key) =>
		((VISUAL_PREF_KEYS as readonly string[]).includes(key) || key === "assist_bounce_zones") &&
		["string", "number", "boolean"].includes(typeof (value as Record<string, unknown>)[key])
	);

const captureVisualSnapshot = (prefs: Record<string, unknown>): VisualSnapshot => {
	const snapshot: VisualSnapshot = {};
	for (const key of VISUAL_PREF_KEYS) {
		const value = prefs[key];
		if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
			snapshot[key] = value;
		}
	}
	return snapshot;
};

const applyVisualSnapshot = async (snapshot: VisualSnapshot): Promise<void> => {
	const theme: {
		enabled?: boolean; cards?: boolean; cardStyle?: "glass" | "solid" | "flat"; density?: number;
		accent?: string; accent2?: string; glow?: string; glowStrength?: number; radius?: number;
		noBlur?: boolean; lowGpu?: boolean;
	} = {};
	if (typeof snapshot.theme_enabled === "boolean") theme.enabled = snapshot.theme_enabled;
	if (typeof snapshot.theme_cards === "boolean") theme.cards = snapshot.theme_cards;
	if (snapshot.theme_card_style === "glass" || snapshot.theme_card_style === "solid" || snapshot.theme_card_style === "flat") theme.cardStyle = snapshot.theme_card_style;
	if (typeof snapshot.theme_density === "number") theme.density = snapshot.theme_density;
	if (typeof snapshot.theme_accent === "string") theme.accent = snapshot.theme_accent;
	if (typeof snapshot.theme_accent2 === "string") theme.accent2 = snapshot.theme_accent2;
	if (typeof snapshot.theme_glow === "string") theme.glow = snapshot.theme_glow;
	if (typeof snapshot.theme_glow_strength === "number") theme.glowStrength = snapshot.theme_glow_strength;
	if (typeof snapshot.theme_radius === "number") theme.radius = snapshot.theme_radius;
	if (typeof snapshot.ui_blur === "boolean") theme.noBlur = !snapshot.ui_blur;
	if (typeof snapshot.fps_mode === "boolean") theme.lowGpu = snapshot.fps_mode;
	updateThemeLive(theme);

	const lines: Partial<LinesConfig> = {};
	if (typeof snapshot.bg_enabled === "boolean") lines.bgEnabled = snapshot.bg_enabled;
	if (typeof snapshot.bg_from === "string") lines.bgFrom = snapshot.bg_from;
	if (typeof snapshot.bg_to === "string") lines.bgTo = snapshot.bg_to;
	if (typeof snapshot.bg_anim === "boolean") lines.bgAnim = snapshot.bg_anim;
	if (typeof snapshot.bg_crest === "boolean") lines.bgCrest = snapshot.bg_crest;
	if (typeof snapshot.lines_enabled === "boolean") lines.enabled = snapshot.lines_enabled;
	if (typeof snapshot.line_width_field === "number") lines.field = snapshot.line_width_field;
	if (typeof snapshot.line_width_ball === "number") lines.ball = snapshot.line_width_ball;
	if (typeof snapshot.line_width_players === "number") lines.players = snapshot.line_width_players;
	if (typeof snapshot.pitch_flat === "boolean") lines.flatPitch = snapshot.pitch_flat;
	if (typeof snapshot.pitch_flat_color === "string") lines.flatColor = snapshot.pitch_flat_color;
	if (typeof snapshot.vis_enabled === "boolean") lines.cosEnabled = snapshot.vis_enabled;
	if (typeof snapshot.vis_my_scale === "number") lines.myScale = snapshot.vis_my_scale;
	if (typeof snapshot.vis_ball_scale === "number") lines.ballScale = snapshot.vis_ball_scale;
	if (typeof snapshot.vis_ball_color === "string") lines.ballColor = snapshot.vis_ball_color;
	if (typeof snapshot.vis_ball_trail === "boolean") lines.ballTrail = snapshot.vis_ball_trail;
	if (typeof snapshot.assist_shot_angles === "boolean") lines.assistShotAngles = snapshot.assist_shot_angles;
	if (typeof snapshot.assist_pass_lines === "boolean") lines.assistPassLines = snapshot.assist_pass_lines;
	if (typeof snapshot.assist_ball_distance === "boolean") lines.assistBallDistance = snapshot.assist_ball_distance;
	if (typeof snapshot.assist_blocked_shot === "boolean") lines.assistBlockedShot = snapshot.assist_blocked_shot;
	if (snapshot.assist_team_mode === "auto" || snapshot.assist_team_mode === "red" || snapshot.assist_team_mode === "blue") {
		lines.assistTeamMode = snapshot.assist_team_mode;
	}
	if (snapshot.assist_attack_direction === "auto" || snapshot.assist_attack_direction === "left" || snapshot.assist_attack_direction === "right") {
		lines.assistAttackDirection = snapshot.assist_attack_direction;
	}
	if (typeof snapshot.wm_enabled === "boolean") lines.wmEnabled = snapshot.wm_enabled;
	if (typeof snapshot.wm_opacity === "number") lines.wmOpacity = snapshot.wm_opacity;
	if (typeof snapshot.wm_size === "number") lines.wmSize = snapshot.wm_size;
	if (typeof snapshot.fps_mode === "boolean") lines.lowPerformance = snapshot.fps_mode;
	if (typeof snapshot.club_logo === "string") lines.wmLogo = snapshot.club_logo;
	updateLinesLive(lines);

	const fx: { enabled?: boolean; banner?: boolean; cinematic?: boolean; edge?: boolean; splash?: boolean; splashSound?: boolean; lowLatency?: boolean; logo?: string; redColor?: string; blueColor?: string } = {};
	if (typeof snapshot.fx_enabled === "boolean") fx.enabled = snapshot.fx_enabled;
	if (typeof snapshot.fx_banner === "boolean") fx.banner = snapshot.fx_banner;
	if (typeof snapshot.fx_cinematic === "boolean") fx.cinematic = snapshot.fx_cinematic;
	if (typeof snapshot.fx_edge === "boolean") fx.edge = snapshot.fx_edge;
	if (typeof snapshot.fx_splash === "boolean") fx.splash = snapshot.fx_splash;
	if (typeof snapshot.fx_splash_sound === "boolean") fx.splashSound = snapshot.fx_splash_sound;
	if (typeof snapshot.fps_mode === "boolean") fx.lowLatency = snapshot.fps_mode;
	if (typeof snapshot.fx_red_color === "string") fx.redColor = snapshot.fx_red_color;
	if (typeof snapshot.fx_blue_color === "string") fx.blueColor = snapshot.fx_blue_color;
	if (typeof snapshot.club_logo === "string") fx.logo = snapshot.club_logo;
	updateFx(fx);
	if (typeof snapshot.club_logo === "string") setLogo(snapshot.club_logo);
	if (typeof snapshot.fps_mode === "boolean") setBackgroundPerformanceMode(snapshot.fps_mode);
	refreshBackground();

	const updates: Partial<Record<VisualPrefKey, VisualPrefValue>> = {};
	for (const key of VISUAL_PREF_KEYS) {
		const value = snapshot[key];
		if (value !== undefined) updates[key] = value;
	}
	await window.electronAPI.setAppPreferences(updates);
};

// ---- constructores de filas --------------------------------------------------

const el = <K extends keyof HTMLElementTagNameMap>(
	tag: K,
	className?: string,
	text?: string
): HTMLElementTagNameMap[K] => {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text !== undefined) node.textContent = text;
	return node;
};

const labelBlock = (label: string, hint?: string, tag?: string): HTMLDivElement => {
	const box = el("div", "hx-label", label);
	if (tag) box.appendChild(el("span", "hx-tag", tag));
	if (hint) box.appendChild(el("span", "hx-hint", hint));
	return box;
};

const group = (title: string): HTMLDivElement => el("div", "hx-group", title);

const switchRow = (
	label: string,
	hint: string | undefined,
	value: boolean,
	onChange: (on: boolean) => void,
	tag?: string
): HTMLDivElement => {
	const row = el("div", "hx-row");
	const wrap = el("label", "hx-switch");
	const input = el("input");
	input.type = "checkbox";
	input.checked = value;
	input.addEventListener("change", () => onChange(input.checked));
	wrap.appendChild(input);
	wrap.appendChild(el("span"));
	row.appendChild(labelBlock(label, hint, tag));
	row.appendChild(wrap);
	return row;
};

const sliderRow = (
	label: string,
	value: number,
	min: number,
	max: number,
	step: number,
	format: (v: number) => string,
	onLive: (v: number) => void,
	onCommit: (v: number) => void,
	hint?: string
): HTMLDivElement => {
	const row = el("div", "hx-row");
	const box = el("div", "hx-slider");
	const input = el("input");
	input.type = "range";
	input.min = String(min);
	input.max = String(max);
	input.step = String(step);
	input.value = String(value);
	const out = el("span", "hx-val", format(value));
	input.addEventListener("input", () => {
		const v = Number(input.value);
		out.textContent = format(v);
		onLive(v);
	});
	input.addEventListener("change", () => onCommit(Number(input.value)));
	box.appendChild(input);
	box.appendChild(out);
	row.appendChild(labelBlock(label, hint));
	row.appendChild(box);
	return row;
};

const selectRow = (
	label: string,
	value: string,
	options: { value: string; label: string }[],
	onChange: (value: string) => void,
	hint?: string
): HTMLDivElement => {
	const row = el("div", "hx-row");
	const select = el("select", "hx-select");
	options.forEach(({ value: optionValue, label: optionLabel }) => {
		const option = el("option", undefined, optionLabel);
		option.value = optionValue;
		select.appendChild(option);
	});
	select.value = value;
	select.addEventListener("change", () => onChange(select.value));
	row.appendChild(labelBlock(label, hint));
	row.appendChild(select);
	return row;
};

const colorRow = (
	label: string,
	value: string,
	onLive: (hex: string) => void,
	onCommit: (hex: string) => void,
	extra?: HTMLElement,
	presets?: { name: string; hex: string }[],
	hint?: string
): HTMLDivElement => {
	const row = el("div", "hx-row");
	const box = el("div", "hx-swatches");
	const dots: HTMLButtonElement[] = [];
	const mark = (hex: string) =>
		dots.forEach((d) => d.classList.toggle("on", (d.dataset.hex || "").toLowerCase() === hex.toLowerCase()));

	const picker = el("input");
	picker.type = "color";
	picker.value = isValidHex(value) && value.length === 7 ? value : "#3b82f6";
	picker.title = "Color personalizado";

	(presets || []).forEach((p) => {
		const dot = el("button", "hx-dot");
		dot.title = p.name;
		dot.dataset.hex = p.hex;
		dot.style.setProperty("background", p.hex, "important");
		dot.addEventListener("click", () => {
			picker.value = p.hex;
			mark(p.hex);
			onLive(p.hex);
			onCommit(p.hex);
		});
		dots.push(dot);
		box.appendChild(dot);
	});
	picker.addEventListener("input", () => { mark(""); onLive(picker.value); });
	picker.addEventListener("change", () => onCommit(picker.value));
	box.appendChild(picker);
	if (extra) box.appendChild(extra);
	mark(value);
	row.appendChild(labelBlock(label, hint));
	row.appendChild(box);
	return row;
};

const segRow = (
	label: string,
	options: { value: string; text: string }[],
	value: string,
	onChange: (v: string) => void,
	hint?: string
): HTMLDivElement => {
	const row = el("div", "hx-row");
	const seg = el("div", "hx-seg");
	options.forEach((o) => {
		const b = el("button", o.value === value ? "on" : "", o.text);
		b.addEventListener("click", () => {
			seg.querySelectorAll("button").forEach((x) => x.classList.remove("on"));
			b.classList.add("on");
			onChange(o.value);
		});
		seg.appendChild(b);
	});
	row.appendChild(labelBlock(label, hint));
	row.appendChild(seg);
	return row;
};

// ---- secciones ------------------------------------------------------------------

let restartNeeded = false;

const restartSwitch = (label: string, hint: string, key: string, value: boolean, tag?: string, invert = false) =>
	switchRow(label, hint, invert ? !value : value, (on) => {
		SAVE(key, invert ? !on : on);
		restartNeeded = true;
		refreshBanner();
	}, tag);

const buildLook = async (): Promise<HTMLElement> => {
	const prefs = await window.electronAPI.getAppPreferences();
	const t = getThemeConfig();
	const box = el("div");
	box.appendChild(el("h2", "", "Aspecto"));
	box.appendChild(el("p", "hx-sub", "Todo se aplica al instante y queda guardado."));

	box.appendChild(group("Estilos rápidos"));
	box.appendChild(el("p", "hx-sub", "Cada estilo combina colores, cancha y efectos. Guarda tu configuración actual como Personalizado."));
	const presetGrid = el("div", "hx-presets");
	for (const preset of VISUAL_PRESETS) {
		const button = el("button", "hx-btn ghost hx-preset");
		button.append(el("span", "", preset.name), el("small", "", preset.hint));
		button.addEventListener("click", () => {
			void applyVisualSnapshot(preset.values).then(() => {
				showToast(`Estilo ${preset.name} aplicado`);
				openSection = null;
				void showSection("look");
			}).catch((error) => {
				console.error("[panel] no se pudo aplicar el estilo", error);
				showToast("No se pudo guardar el estilo");
			});
		});
		presetGrid.appendChild(button);
	}
	const custom = prefs?.visual_preset_custom;
	if (isVisualSnapshot(custom) && Object.keys(custom).length > 0) {
		const button = el("button", "hx-btn ghost hx-preset");
		button.append(el("span", "", "Personalizado"), el("small", "", "Aplicar tu estilo guardado."));
		button.addEventListener("click", () => {
			void applyVisualSnapshot(custom).then(() => {
				showToast("Estilo personalizado aplicado");
				openSection = null;
				void showSection("look");
			}).catch((error) => {
				console.error("[panel] no se pudo aplicar el estilo personalizado", error);
				showToast("No se pudo guardar el estilo");
			});
		});
		presetGrid.appendChild(button);
	}
	box.appendChild(presetGrid);
	const saveCustom = el("button", "hx-btn ghost", "Guardar como Personalizado");
	saveCustom.style.width = "100%";
	saveCustom.addEventListener("click", () => {
		void window.electronAPI.getAppPreferences().then((current) =>
			window.electronAPI.setAppPreference("visual_preset_custom", captureVisualSnapshot(current))
		).then(() => {
			showToast("Estilo personalizado guardado");
			openSection = null;
			void showSection("look");
		}).catch((error) => {
			console.error("[panel] no se pudo guardar el estilo personalizado", error);
			showToast("No se pudo guardar el estilo");
		});
	});
	box.appendChild(saveCustom);

	box.appendChild(switchRow("Estilo moderno", "Apagado = look original de HaxBall", t.enabled, (on) => {
		updateThemeLive({ enabled: on });
		SAVE("theme_enabled", on);
	}));

	box.appendChild(switchRow("Interfaz de tarjetas", "Rediseno de la lista de salas, la sala del host y los menus", t.cards, (on) => {
		updateThemeLive({ cards: on });
		SAVE("theme_cards", on);
	}));
	box.appendChild(segRow("Estilo de tarjeta", [
		{ value: "glass", text: "Cristal" },
		{ value: "solid", text: "Solido" },
		{ value: "flat", text: "Plano" },
	], t.cardStyle, (v) => {
		updateThemeLive({ cardStyle: v as any });
		SAVE("theme_card_style", v);
	}, "Cristal usa desenfoque; se apaga solo con baja latencia"));
	box.appendChild(sliderRow("Densidad", t.density, 0.6, 1.6, 0.1,
		(v) => (v < 0.85 ? "Compacta" : v > 1.25 ? "Amplia" : "Normal"),
		(v) => updateThemeLive({ density: v }),
		(v) => SAVE("theme_density", v),
		"Espacio entre filas y bloques"));

	box.appendChild(group("Tema del club"));
	const club = el("button", "hx-btn", "Toda la Lecce (colores del escudo)");
	club.style.width = "100%";
	club.addEventListener("click", () => {
		updateThemeLive({ accent: CLUB_THEME.accent, accent2: CLUB_THEME.accent2, glow: "", enabled: true });
		SAVE("theme_accent", CLUB_THEME.accent);
		SAVE("theme_accent2", CLUB_THEME.accent2);
		SAVE("theme_glow", "");
		SAVE("theme_enabled", true);
		openSection = null;
		showSection("look"); // recargar los controles con los colores nuevos
	});
	box.appendChild(club);
	box.appendChild(buildLogoRow());

	box.appendChild(group("Colores"));
	box.appendChild(colorRow("Color de acento", t.accent,
		(hex) => updateThemeLive({ accent: hex, enabled: true }),
		(hex) => { SAVE("theme_accent", hex); SAVE("theme_enabled", true); },
		undefined, PRESETS));

	const noSecond = el("button", "hx-btn ghost", "Quitar");
	noSecond.addEventListener("click", () => {
		updateThemeLive({ accent2: "" });
		SAVE("theme_accent2", "");
	});
	box.appendChild(colorRow("Color secundario", t.accent2 || t.accent,
		(hex) => updateThemeLive({ accent2: hex }),
		(hex) => SAVE("theme_accent2", hex),
		noSecond, undefined, "Detalles y segundo brillo (amarillo en el tema del club)"));

	const sameAsAccent = el("button", "hx-btn ghost", "= acento");
	sameAsAccent.title = "Usar el mismo color que el acento";
	sameAsAccent.addEventListener("click", () => {
		updateThemeLive({ glow: "" });
		SAVE("theme_glow", "");
	});
	box.appendChild(colorRow("Brillo de fondo", t.glow || t.accent,
		(hex) => updateThemeLive({ glow: hex }),
		(hex) => SAVE("theme_glow", hex),
		sameAsAccent, undefined, "El resplandor detras de la lista de salas"));
	box.appendChild(sliderRow("Intensidad del brillo", t.glowStrength, 0, 1, 0.05,
		(v) => `${Math.round(v * 100)}%`,
		(v) => updateThemeLive({ glowStrength: v }),
		(v) => SAVE("theme_glow_strength", v)));

	box.appendChild(group("Forma y tamano"));
	box.appendChild(sliderRow("Esquinas", t.radius, 0, 20, 1, (v) => `${v}px`,
		(v) => updateThemeLive({ radius: v }),
		(v) => SAVE("theme_radius", v)));
	box.appendChild(sliderRow("Zoom de la interfaz", Number(prefs?.ui_zoom) || 1, 0.8, 1.4, 0.05,
		(v) => `${Math.round(v * 100)}%`,
		(v) => window.electronAPI.setZoom?.(v),
		(v) => SAVE("ui_zoom", v),
		"Agranda o achica toda la app"));

	box.appendChild(group("Barra lateral"));
	box.appendChild(switchRow("Aparecer al acercar el mouse", "Pasa el mouse por el borde izquierdo; se esconde sola al salir. F9 la deja fija",
		hoverEnabled, (on) => { hoverEnabled = on; SAVE("panel_hover", on); updateVisibility(); }));
	box.appendChild(switchRow("Tambien dentro de una sala", "Apagado: en partida solo aparece con F9, asi no salta sin querer",
		hoverInGame, (on) => { hoverInGame = on; SAVE("panel_hover_ingame", on); updateVisibility(); }));
	return box;
};

const buildPerf = async (): Promise<HTMLElement> => {
	const p = await window.electronAPI.getAppPreferences();
	const box = el("div");
	box.appendChild(el("h2", "", "Rendimiento"));
	box.appendChild(el("p", "hx-sub", "Elige entre mas fluidez visual o mayor calidad. Los ajustes experimentales pueden causar fallos."));

	box.appendChild(group("Sistema"));
	box.appendChild(restartSwitch("Evitar suspensión de pantalla", "Evita que el sistema apague la pantalla mientras la app está abierta", "low_latency", p?.low_latency !== false, "reinicio"));
	box.appendChild(restartSwitch("GPU dedicada", "En laptops con dos placas, usa la potente", "force_gpu", p?.force_gpu === true, "reinicio"));
	box.appendChild(restartSwitch("Prioridad alta de CPU", "El sistema atiende primero a la app cuando la PC esta cargada", "high_priority", p?.high_priority !== false, "reinicio"));

	box.appendChild(group("Cuadros por segundo"));
	box.appendChild(restartSwitch("FPS ilimitado", "Quita el tope de cuadros; puede aumentar consumo y producir tearing", "fps_unlock", p?.fps_unlock !== false, "reinicio"));
	box.appendChild(el("p", "hx-sub", "Para priorizar fluidez y reducir trabajo visual durante la partida:"));
	box.appendChild(switchRow("Modo bajo rendimiento", "Desactiva efectos de gol, personalizaciones del canvas, fondos animados, desenfoques, sombras y animaciones. Se aplica al instante.", p?.fps_mode === true, (on) => {
		updateFx({ lowLatency: on });
		updateThemeLive({ lowGpu: on });
		updateLinesLive({ lowPerformance: on });
		setBackgroundPerformanceMode(on);
		SAVE("fps_mode", on);
	}));
	box.appendChild(switchRow("Desenfoque de tarjetas", "El cristal esmerilado de menus y dialogos (cuesta GPU)", p?.ui_blur !== false, (on) => {
		updateThemeLive({ noBlur: !on });
		SAVE("ui_blur", on);
	}));
	box.appendChild(el("p", "hx-sub", "Tambien podes apagar por separado cada extra en Cancha y Extras (estela, marca de agua, degradé en movimiento, efectos)."));

	box.appendChild(group("Avanzado (opcional)"));
	box.appendChild(restartSwitch("Flags agresivos de GPU", "Raster por GPU forzado y sin raster por software. Mas FPS en algunas PCs, pero puede dejar la ventana en blanco: si pasa, apagalo", "risky_flags", p?.risky_flags === true, "reinicio"));
	box.appendChild(switchRow("Canvas de baja latencia", "Pide al navegador un canvas desincronizado. Sirve desde la proxima sala que abras",
		p?.canvas_desync === true, (on) => { updateLinesLive({ desync: on }); SAVE("canvas_desync", on); }, "sala nueva"));
	box.appendChild(restartSwitch("GPU en el mismo proceso", "Menos comunicacion entre procesos, pero si la GPU falla se cierra la app", "in_process_gpu", p?.in_process_gpu === true, "reinicio"));
	box.appendChild(restartSwitch("Extension All-in-one", "Apagarla ahorra CPU pero se pierden sus funciones (busqueda, emojis, etc.)", "disable_extension", p?.disable_extension === true, "reinicio", true));
	return box;
};

const buildPitch = async (): Promise<HTMLElement> => {
	const p = await window.electronAPI.getAppPreferences();
	const l = getLinesConfig();
	const box = el("div");
	box.appendChild(el("h2", "", "Cancha y lineas"));
	box.appendChild(el("p", "hx-sub", "Se ve al entrar a una sala. F8 prende y apaga las lineas finas."));

	box.appendChild(group("Fondo de afuera"));
	box.appendChild(switchRow("Degradé en vez del pasto verde", "Menu de salas y borde de la sala (al apretar ESC), con los colores del escudo", l.bgEnabled, (on) => {
		updateLinesLive({ bgEnabled: on });
		SAVE("bg_enabled", on);
		refreshBackground();
	}));
	box.appendChild(switchRow("Escudo tenue en el fondo", "Tu escudo muy suave detras del menu", l.bgCrest, (on) => {
		updateLinesLive({ bgCrest: on });
		SAVE("bg_crest", on);
		refreshBackground();
	}));
	box.appendChild(switchRow("Degradé en movimiento", "Se mueve despacio en el menu. Se apaga con el Modo FPS maximo", l.bgAnim, (on) => {
		updateLinesLive({ bgAnim: on });
		SAVE("bg_anim", on);
		refreshBackground();
	}));
	box.appendChild(colorRow("Color de arriba", l.bgFrom,
		(hex) => { updateLinesLive({ bgFrom: hex, bgEnabled: true }); refreshBackground(); },
		(hex) => { SAVE("bg_from", hex); SAVE("bg_enabled", true); },
		undefined, undefined, "Por defecto: azul del escudo"));
	box.appendChild(colorRow("Color de abajo", l.bgTo,
		(hex) => { updateLinesLive({ bgTo: hex, bgEnabled: true }); refreshBackground(); },
		(hex) => { SAVE("bg_to", hex); SAVE("bg_enabled", true); },
		undefined, undefined, "Por defecto: azul oscuro"));

	box.appendChild(group("Textura"));
	box.appendChild(switchRow("Cancha plana", "Sin textura de pasto ni cemento", l.flatPitch, (on) => {
		updateLinesLive({ flatPitch: on });
		SAVE("pitch_flat", on);
	}));
	const auto = el("button", "hx-btn ghost", "Auto");
	auto.title = "Usar el color promedio de la textura";
	auto.addEventListener("click", () => {
		updateLinesLive({ flatColor: "" });
		SAVE("pitch_flat_color", "");
	});
	box.appendChild(colorRow("Color de la cancha", l.flatColor || "#718c5a",
		(hex) => updateLinesLive({ flatColor: hex, flatPitch: true }),
		(hex) => { SAVE("pitch_flat_color", hex); SAVE("pitch_flat", true); },
		auto, undefined, "Auto = promedio de la textura"));

	box.appendChild(group("Grosor de lineas"));
	box.appendChild(switchRow("Lineas personalizadas", "Apagado = grosores originales (3 / 2 / 2)", l.enabled, (on) => {
		updateLinesLive({ enabled: on });
		SAVE("lines_enabled", on);
	}));
	const fmt = (v: number) => v.toFixed(1);
	const slider = (label: string, key: "field" | "ball" | "players", pref: string) =>
		sliderRow(label, l[key], 0, 6, 0.1, fmt, (v) => updateLinesLive({ [key]: v }), (v) => SAVE(pref, v));
	box.appendChild(slider("Lineas de cancha", "field", "line_width_field"));
	box.appendChild(slider("Pelota y objetos", "ball", "line_width_ball"));
	box.appendChild(slider("Jugadores", "players", "line_width_players"));

	box.appendChild(group("Extras visuales"));
	box.appendChild(el("p", "hx-sub", "Solo cambian como se dibuja en TU pantalla. No tocan la fisica: los choques usan los tamaños reales. F7 los prende y apaga."));
	box.appendChild(switchRow("Activar extras visuales", "Apagado = todo se ve como el original", l.cosEnabled, (on) => {
		updateLinesLive({ cosEnabled: on });
		SAVE("vis_enabled", on);
	}));
	const pct = (v: number) => `${Math.round(v * 100)}%`;
	box.appendChild(sliderRow("Tamaño de mi ficha", l.myScale, 0.5, 1.6, 0.05, pct,
		(v) => updateLinesLive({ myScale: v }), (v) => SAVE("vis_my_scale", v), "Solo la tuya, no la de los demas"));
	box.appendChild(sliderRow("Tamaño de la pelota", l.ballScale, 0.5, 1.6, 0.05, pct,
		(v) => updateLinesLive({ ballScale: v }), (v) => SAVE("vis_ball_scale", v)));
	const origBall = el("button", "hx-btn ghost", "Original");
	origBall.title = "Volver al color original de la pelota";
	origBall.addEventListener("click", () => {
		updateLinesLive({ ballColor: "" });
		SAVE("vis_ball_color", "");
	});
	box.appendChild(colorRow("Color de la pelota", l.ballColor || "#ffffff",
		(hex) => updateLinesLive({ ballColor: hex }),
		(hex) => SAVE("vis_ball_color", hex),
		origBall, undefined, "Original = el del mapa"));
	box.appendChild(switchRow("Marca de agua en la cancha", "Tu escudo (o el de TL) tenue en el centro del campo", l.wmEnabled, (on) => {
		updateLinesLive({ wmEnabled: on });
		SAVE("wm_enabled", on);
	}));
	box.appendChild(sliderRow("Opacidad de la marca", l.wmOpacity, 0.02, 0.5, 0.01, (v) => `${Math.round(v * 100)}%`,
		(v) => updateLinesLive({ wmOpacity: v }), (v) => SAVE("wm_opacity", v)));
	box.appendChild(sliderRow("Tamaño de la marca", l.wmSize, 60, 400, 10, (v) => `${Math.round(v)}`,
		(v) => updateLinesLive({ wmSize: v }), (v) => SAVE("wm_size", v)));
	box.appendChild(switchRow("Estela de la pelota", "Rastro que sigue a la pelota", l.ballTrail, (on) => {
		updateLinesLive({ ballTrail: on });
		SAVE("vis_ball_trail", on);
	}));
	return box;
};

const buildSettings = async (): Promise<HTMLElement> => {
	const box = el("div");
	box.appendChild(el("h2", "", "Ajustes"));
	box.appendChild(el("p", "hx-sub", "Herramientas generales, atajos, Auth, copias de seguridad y depuración."));
	const open = el("button", "hx-btn", "Atajos, Auth y copias de seguridad");
	open.style.width = "100%";
	open.addEventListener("click", () => { closeDrawer(); openSettingsAlert(); });
	box.appendChild(open);
	box.appendChild(group("Diagnóstico"));
	const dump = el("button", "hx-btn ghost", "Copiar estructura de la UI");
	dump.style.width = "100%";
	dump.addEventListener("click", async () => {
		const ok = await copyToClipboard(dumpUiStructure());
		dump.textContent = ok ? "Copiado! Pegalo en el chat" : "No se pudo copiar";
		setTimeout(() => (dump.textContent = "Copiar estructura de la UI"), 2500);
	});
	box.appendChild(dump);
	box.appendChild(el("p", "hx-sub", "Copia un resumen de las clases y botones que hay en pantalla (sin chat ni datos tuyos). Abri la pantalla que quieras ajustar y tocalo.")).style.marginTop = "8px";
	box.appendChild(el("p", "hx-sub", "Atajos: F8 lineas finas · F9 mostrar u ocultar el panel"));
	return box;
};

// ---- Extras: chat, sonidos, plantillas, equipo, salas -------------------------------

const readSoundFile = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		if (file.size > 600 * 1024) { reject(new Error("El audio pesa mas de 600 KB")); return; }
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});

const textArea = (value: string, rows: number, placeholder: string): HTMLTextAreaElement => {
	const area = document.createElement("textarea");
	area.value = value;
	area.rows = rows;
	area.placeholder = placeholder;
	area.style.cssText = "width:100%;box-sizing:border-box;padding:8px 10px;font-size:13px;color:#fff;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);resize:vertical;";
	area.addEventListener("keydown", (e) => e.stopPropagation());
	return area;
};

const soundPicker = (label: string, kind: "mention" | "msg" | "goal", prefKey: string): HTMLElement => {
	const urlKey = kind === "mention" ? "mentionUrl" : kind === "goal" ? "goalUrl" : "msgUrl";
	const defaultText = kind === "goal" ? "Sin sonido propio (suena el del juego)" : "Sonido generado por la app";
	const wrap = el("div");
	wrap.style.cssText = "display:flex;flex-direction:column;gap:6px;padding:6px 0;";
	const status = el("div", "hx-hint", getExtras()[urlKey] ? "Sonido propio cargado" : defaultText);
	wrap.appendChild(labelBlock(label));
	wrap.appendChild(status);
	const buttons = el("div", "hx-swatches");
	const pick = el("button", "hx-btn", "Elegir audio");
	pick.addEventListener("click", () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "audio/*";
		input.addEventListener("change", async () => {
			const file = input.files?.[0];
			if (!file) return;
			try {
				const url = await readSoundFile(file);
				updateExtras({ [urlKey]: url });
				SAVE(prefKey, url);
				status.textContent = "Sonido propio cargado";
				playSound(kind);
			} catch (error) {
				status.textContent = String((error as Error).message || error);
			}
		});
		holdUntilDone();
		input.click();
	});
	const test = el("button", "hx-btn ghost", "Probar");
	test.addEventListener("click", () => playSound(kind));
	const reset = el("button", "hx-btn ghost", "Quitar");
	reset.addEventListener("click", () => {
		updateExtras({ [urlKey]: "" });
		SAVE(prefKey, "");
		status.textContent = defaultText;
	});
	buttons.append(pick, test, reset);
	wrap.appendChild(buttons);
	return wrap;
};

const buildExtras = async (): Promise<HTMLElement> => {
	const x = getExtras();
	const box = el("div");
	box.appendChild(el("h2", "", "Chat, equipo y salas"));
	box.appendChild(el("p", "hx-sub", "Funciones propias de TL App. Los complementos tienen su panel aparte."));

	box.appendChild(group("Chat"));
	box.appendChild(switchRow("Resaltar si me mencionan", "Marca el mensaje que incluye tu nombre", x.chatHighlight, (on) => {
		updateExtras({ chatHighlight: on });
		SAVE("x_chat_highlight", on);
	}));
	box.appendChild(switchRow("Sonido al mencionarme", undefined, x.mentionSound, (on) => {
		updateExtras({ mentionSound: on });
		SAVE("x_mention_sound", on);
	}));
	box.appendChild(switchRow("Sonido en cada mensaje ajeno", "Un tic suave por mensaje", x.msgSound, (on) => {
		updateExtras({ msgSound: on });
		SAVE("x_msg_sound", on);
	}));
	box.appendChild(sliderRow("Volumen de avisos", x.volume, 0, 1, 0.05, (v) => `${Math.round(v * 100)}%`,
		(v) => updateExtras({ volume: v }), (v) => SAVE("x_snd_vol", v)));
	box.appendChild(soundPicker("Sonido de mencion", "mention", "x_snd_mention"));
	box.appendChild(soundPicker("Sonido de mensaje", "msg", "x_snd_msg"));
	box.appendChild(soundPicker("Sonido de gol (se suma al del juego)", "goal", "x_snd_goal"));
	box.appendChild(el("p", "hx-sub", "El sonido original del gol y de la patada viene dentro del juego y no lo puedo reemplazar: el tuyo suena ademas del original."));

	box.appendChild(group("Efectos"));
	box.appendChild(el("p", "hx-sub", "Se apagan con el Modo FPS maximo (Rendimiento)."));
	const fx = getFx();
	box.appendChild(switchRow("Efectos activados", "Interruptor general", fx.enabled, (on) => { updateFx({ enabled: on }); SAVE("fx_enabled", on); }));
	box.appendChild(switchRow("Banner de gol", "Cartel animado con destello del color del equipo", fx.banner, (on) => { updateFx({ banner: on }); SAVE("fx_banner", on); }));
	box.appendChild(switchRow("Camara lenta falsa", "Vineta oscura y un zoom corto despues del gol (solo visual)", fx.cinematic, (on) => { updateFx({ cinematic: on }); SAVE("fx_cinematic", on); }));
	box.appendChild(switchRow("Borde en los ultimos segundos", "El borde de la pantalla late en rojo al final del partido", fx.edge, (on) => { updateFx({ edge: on }); SAVE("fx_edge", on); }));
	box.appendChild(switchRow("Entrada animada", "Pantalla de bienvenida con el escudo al abrir la app", fx.splash, (on) => { updateFx({ splash: on }); SAVE("fx_splash", on); }));
	box.appendChild(switchRow("Sonido al iniciar", "Acorde breve y suave al abrir TL App", fx.splashSound, (on) => {
		updateFx({ splashSound: on });
		SAVE("fx_splash_sound", on);
	}));
	const startupSoundDemo = el("button", "hx-btn ghost", "Probar sonido de inicio");
	startupSoundDemo.style.width = "100%";
	startupSoundDemo.addEventListener("click", () => playStartupSound(true));
	box.appendChild(startupSoundDemo);
	box.appendChild(colorRow("Color de gol rojo", fx.redColor,
		(hex) => updateFx({ redColor: hex }),
		(hex) => SAVE("fx_red_color", hex), undefined, undefined, "Se usa en el banner y destello del equipo rojo."));
	box.appendChild(colorRow("Color de gol azul", fx.blueColor,
		(hex) => updateFx({ blueColor: hex }),
		(hex) => SAVE("fx_blue_color", hex), undefined, undefined, "Se usa en el banner y destello del equipo azul."));
	const demo = el("button", "hx-btn ghost", "Probar efecto de gol");
	demo.style.width = "100%";
	demo.addEventListener("click", () => showGoal("red", 1, 0));
	box.appendChild(demo);

	box.appendChild(group("Plantillas de mensajes (Alt + 1 a 9)"));
	box.appendChild(el("p", "hx-sub", "Un mensaje por linea. Alt+1 manda la primera, Alt+2 la segunda, etc. (hasta 9)."));
	const tpl = textArea(x.templates.join("\n"), 6, "gg\npasala\ndefensa!");
	tpl.addEventListener("change", () => {
		const list = tpl.value.split("\n").map((t) => t.trim()).filter(Boolean).slice(0, 9);
		updateExtras({ templates: list });
		SAVE("x_templates", list);
		showToast(`${list.length} plantillas guardadas`);
	});
	box.appendChild(tpl);
	const sendRow = el("div", "hx-swatches");
	x.templates.slice(0, 9).forEach((t, i) => {
		const b = el("button", "hx-btn ghost", `${i + 1}`);
		b.title = t;
		b.addEventListener("click", () => { if (!sendChat(getExtras().templates[i] || t)) showToast("Entra a una sala para usar el chat"); });
		sendRow.appendChild(b);
	});
	box.appendChild(sendRow);

	box.appendChild(group("Mi equipo"));
	box.appendChild(el("p", "hx-sub", "Nombres de tus companeros, uno por linea. Se marcan con una barrita amarilla en la lista de jugadores de la sala."));
	const team = textArea(x.team.join("\n"), 4, "Nombre1\nNombre2");
	const present = el("p", "hx-sub", "");
	const refreshPresent = () => {
		const list = getTeamPresent();
		present.textContent = list.length ? `En tu sala ahora: ${list.join(", ")}` : "Ninguno en tu sala ahora";
	};
	refreshPresent();
	team.addEventListener("change", () => {
		const list = team.value.split("\n").map((t) => t.trim()).filter(Boolean);
		updateExtras({ team: list });
		SAVE("x_team", list);
		setTimeout(refreshPresent, 1200);
	});
	box.appendChild(team);
	box.appendChild(present);

	box.appendChild(group("Salas"));
	box.appendChild(switchRow("Avisar si aparece una sala favorita", "Notificacion al verla en la lista (hay que tener la lista de salas abierta)", x.favAlerts, (on) => {
		updateExtras({ favAlerts: on });
		SAVE("x_fav_alerts", on);
	}));
	const last = el("p", "hx-sub", x.lastRoom ? `Ultima sala: ${x.lastRoom}` : "Todavia no hay una ultima sala guardada.");
	const rejoin = el("button", "hx-btn", "Volver a la ultima sala");
	rejoin.style.width = "100%";
	rejoin.addEventListener("click", () => {
		const msg = rejoinLastRoom();
		showToast(msg);
		last.textContent = msg;
	});
	box.appendChild(rejoin);
	box.appendChild(last);
	const favorites = getFavoriteRooms();
	box.appendChild(group("Acceso rapido a favoritas"));
	if (favorites.length) {
		const favoriteButtons = el("div", "hx-presets");
		favorites.slice(0, 8).forEach((name) => {
			const button = el("button", "hx-btn ghost hx-preset", name);
			button.title = `Entrar a ${name}`;
			button.addEventListener("click", () => showToast(joinRoomByName(name)));
			favoriteButtons.appendChild(button);
		});
		box.appendChild(favoriteButtons);
		if (favorites.length > 8) box.appendChild(el("p", "hx-hint", `Se muestran 8 de ${favorites.length} favoritas.`));
	} else {
		box.appendChild(el("p", "hx-sub", "Aun no hay salas favoritas. Marca una desde la lista de salas de HaxBall."));
	}

	box.appendChild(group("Complementos"));
	box.appendChild(el("p", "hx-sub", "Las opciones de busqueda, autoentrada, mute y atajos pertenecen a All-in-one; no se duplican aqui."));
	const addonOptions = el("button", "hx-btn ghost", "Abrir opciones de Add-on");
	addonOptions.style.width = "100%";
	addonOptions.addEventListener("click", () => {
		try {
			const frame = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement | undefined;
			const button = frame?.contentDocument?.querySelector('[data-hook="add-on"]') as HTMLElement | null;
			if (button) button.click();
			else showToast("Usa el boton Add-on de la barra superior para abrir sus opciones.");
		} catch (error) {
			console.error("[panel] no se pudo abrir la configuracion de Add-on", error);
			showToast("No se pudo abrir Add-on Settings");
		}
	});
	box.appendChild(addonOptions);
	return box;
};

const BUILDERS: Record<SectionId, () => Promise<HTMLElement>> = {
	look: buildLook,
	perf: buildPerf,
	pitch: buildPitch,
	extras: buildExtras,
	settings: buildSettings,
};

// ---- armado general ----------------------------------------------------------------

let root: HTMLDivElement | null = null;
let drawer: HTMLDivElement | null = null;
let content: HTMLDivElement | null = null;
let banner: HTMLDivElement | null = null;
let logoEl: HTMLDivElement | null = null;
let openSection: SectionId | null = null;

// visibilidad: se muestra si esta fijada con F9 o si el mouse esta encima
let hoverEnabled = true; // aparecer al acercar el mouse al borde
let hoverInGame = false; // lo mismo, pero dentro de una sala
let pinned = false; // F9
let hovering = false;
let pointerInside = false;
let dragging = false; // arrastrando un slider (el mouse puede salir del panel)
let holdOpen = false; // selector de color / de archivo abierto
let hideTimer: number | undefined;
let lastInGame = false;

const refreshBanner = (): void => {
	if (!banner) return;
	banner.style.display = restartNeeded ? "block" : "none";
};

const closeDrawer = (): void => {
	openSection = null;
	drawer?.classList.remove("open");
	root?.querySelectorAll(".hx-nav").forEach((n) => n.classList.remove("on"));
};

const showSection = async (id: SectionId): Promise<void> => {
	if (!drawer || !content) return;
	if (openSection === id) { closeDrawer(); return; }
	openSection = id;
	root?.querySelectorAll(".hx-nav").forEach((n) =>
		n.classList.toggle("on", (n as HTMLElement).dataset.section === id));
	content.innerHTML = "";
	try {
		content.appendChild(await BUILDERS[id]());
	} catch (error) {
		console.error("[panel]", error);
		content.appendChild(el("p", "hx-sub", "No se pudo cargar esta seccion."));
	}
	drawer.classList.add("open");
};

const isInGame = (): boolean => {
	try {
		const frame = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement | undefined;
		return !!frame?.contentDocument?.querySelector(".game-view");
	} catch {
		return false;
	}
};

const hotAllowed = (): boolean => hoverEnabled && (hoverInGame || !lastInGame);

const applyOpen = (): void => {
	if (!root) return;
	const open = pinned || hovering;
	root.classList.toggle("hx-open", open);
	if (!open) closeDrawer();
};

const updatePanelTop = (): void => {
	if (!root) return;
	const header = document.querySelector(".header.tl-header, .header") as HTMLElement | null;
	const bottom = header?.getBoundingClientRect().bottom ?? 0;
	const offset = bottom > 0 ? Math.ceil(bottom + 6) : 0;
	root.style.setProperty("--hx-panel-top", `${offset}px`);
};

const updateVisibility = (): void => {
	if (!root) return;
	updatePanelTop();
	const inGame = isInGame();
	if (inGame !== lastInGame) { // al entrar / salir de una sala se empieza de cero
		lastInGame = inGame;
		pinned = false;
		hovering = false;
	}
	root.classList.toggle("hx-nohot", !hotAllowed());
	// red de seguridad: si quedo abierta por el mouse pero ya no hay nada que la
	// retenga (el mouse salio de la ventana sin avisar), se programa el cierre
	if (hovering && !pinned && !pointerInside && !dragging && !holdOpen && hideTimer === undefined) {
		scheduleHide();
	}
	applyOpen();
};

const cancelHide = (): void => {
	if (hideTimer !== undefined) { window.clearTimeout(hideTimer); hideTimer = undefined; }
};

const scheduleHide = (): void => {
	cancelHide();
	hideTimer = window.setTimeout(() => {
		hideTimer = undefined;
		if (pointerInside || dragging || holdOpen) return;
		hovering = false;
		applyOpen();
	}, 350);
};

// Mientras hay un selector nativo abierto (color, archivo) el mouse sale de la
// pagina; no escondemos hasta que se cierre (clic afuera o la ventana recupera foco).
export const holdUntilDone = (): void => {
	holdOpen = true;
	const release = () => {
		holdOpen = false;
		document.removeEventListener("mousedown", onDown, true);
		if (!pointerInside) scheduleHide();
	};
	const onDown = (e: MouseEvent) => {
		if (!root?.contains(e.target as Node)) release();
	};
	document.addEventListener("mousedown", onDown, true);
	window.addEventListener("focus", () => window.setTimeout(release, 400), { once: true });
};

export const togglePanel = (): void => {
	if (!root) return;
	pinned = !pinned;
	if (!pinned) hovering = false;
	applyOpen();
};

// ---- escudo del club (imagen propia) -------------------------------------------

const setLogo = (url: string): void => {
	if (!logoEl) return;
	const ok = typeof url === "string" && url.startsWith("data:image/");
	logoEl.style.backgroundImage = ok ? `url("${url}")` : "";
	logoEl.classList.toggle("on", ok);
};

const fileToLogo = (file: File, size: number): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(reader.error);
		reader.onload = () => {
			const img = new Image();
			img.onerror = () => reject(new Error("imagen invalida"));
			img.onload = () => {
				const canvas = document.createElement("canvas");
				canvas.width = size;
				canvas.height = size;
				const ctx = canvas.getContext("2d");
				if (!ctx) return reject(new Error("sin canvas"));
				const scale = Math.min(size / img.width, size / img.height);
				const w = img.width * scale;
				const h = img.height * scale;
				ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
				resolve(canvas.toDataURL("image/png"));
			};
			img.src = String(reader.result);
		};
		reader.readAsDataURL(file);
	});

function buildLogoRow(): HTMLDivElement {
	const row = el("div", "hx-row");
	const preview = el("div", "hx-logo-preview");
	const refreshPreview = () => {
		preview.style.backgroundImage = logoEl?.style.backgroundImage || "";
	};
	refreshPreview();

	const pick = el("button", "hx-btn", "Elegir imagen");
	pick.addEventListener("click", () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.addEventListener("change", async () => {
			const file = input.files?.[0];
			if (!file) return;
			try {
				const url = await fileToLogo(file, 128);
				SAVE("club_logo", url);
				setLogo(url);
				updateLinesLive({ wmLogo: url });
				updateFx({ logo: url });
				refreshPreview();
			} catch (error) {
				console.error("[panel] escudo", error);
			}
		});
		holdUntilDone();
		input.click();
	});
	const clear = el("button", "hx-btn ghost", "Quitar");
	clear.addEventListener("click", () => {
		SAVE("club_logo", "");
		setLogo(BRAND_LOGO);
		updateLinesLive({ wmLogo: "" });
		updateFx({ logo: "" });
		refreshPreview();
	});

	const buttons = el("div", "hx-swatches");
	buttons.appendChild(pick);
	buttons.appendChild(clear);
	row.appendChild(labelBlock("Escudo del club", "Tu propia imagen; aparece arriba en la barra lateral"));
	row.appendChild(preview);
	const wrap = el("div");
	wrap.style.cssText = "display:flex;flex-direction:column;gap:8px;";
	wrap.appendChild(row);
	wrap.appendChild(buttons);
	const outer = el("div");
	outer.appendChild(wrap);
	return outer;
}

// ---- armado ------------------------------------------------------------------------

export const startPanel = async (): Promise<void> => {
	if (document.getElementById(ROOT_ID)) return;

	let logo = BRAND_LOGO;
	try {
		const prefs = await window.electronAPI.getAppPreferences();
		hoverEnabled = prefs?.panel_hover ?? true;
		hoverInGame = prefs?.panel_hover_ingame ?? false;
		logo = typeof prefs?.club_logo === "string" && prefs.club_logo ? prefs.club_logo : BRAND_LOGO;
	} catch { /* valores por defecto */ }

	const style = document.createElement("style");
	style.id = STYLE_ID;
	style.textContent = CSS;
	document.head.appendChild(style);

	root = el("div");
	root.id = ROOT_ID;

	const hot = el("div", "hx-hot");
	hot.addEventListener("mouseenter", () => {
		if (!hotAllowed()) return;
		pointerInside = true;
		cancelHide();
		hovering = true;
		applyOpen();
	});

	const bar = el("div", "hx-bar");
	logoEl = el("div", "hx-logo");
	bar.appendChild(logoEl);
	setLogo(logo);
	SECTIONS.forEach((s) => {
		const btn = el("button", "hx-nav");
		btn.dataset.section = s.id;
		btn.title = s.title;
		btn.innerHTML = `<svg viewBox="0 0 24 24">${ICONS[s.id]}</svg><span>${s.label}</span>`;
		btn.addEventListener("click", () => showSection(s.id));
		bar.appendChild(btn);
	});

	drawer = el("div", "hx-drawer");
	content = el("div");
	banner = el("div", "hx-banner");
	banner.style.display = "none";
	banner.appendChild(el("div", "", "Hay cambios que se aplican al reiniciar la app."));
	const restart = el("button", "hx-btn", "Reiniciar ahora");
	restart.addEventListener("click", () => window.electronAPI.restartApp());
	banner.appendChild(restart);
	banner.appendChild(el("div", "hx-hint", "Si no se reabre sola, cerrala y abrila de nuevo."));
	drawer.appendChild(content);
	drawer.appendChild(banner);

	// el mouse sobre la barra o el panel lo mantiene abierto; al salir se esconde solo
	[bar, drawer].forEach((part) => {
		part.addEventListener("mouseenter", () => { pointerInside = true; cancelHide(); });
		part.addEventListener("mouseleave", () => { pointerInside = false; scheduleHide(); });
	});
	// arrastrar un slider puede sacar el mouse del panel: no esconder hasta soltar
	root.addEventListener("mousedown", () => { dragging = true; });
	document.addEventListener("mouseup", () => {
		if (!dragging) return;
		dragging = false;
		if (!pointerInside) scheduleHide();
	});
	// selector de color nativo
	root.addEventListener("click", (e) => {
		const t = e.target as HTMLElement;
		if (t instanceof HTMLInputElement && t.type === "color") holdUntilDone();
	});

	root.appendChild(hot);
	root.appendChild(bar);
	root.appendChild(drawer);
	document.body.appendChild(root);

	const header = document.querySelector(".header.tl-header, .header");
	if (header) {
		new MutationObserver(updatePanelTop).observe(header, { attributes: true, attributeFilter: ["class", "style"] });
		header.addEventListener("transitionend", updatePanelTop);
	}
	window.addEventListener("resize", updatePanelTop);
	updatePanelTop();
	(window as any).__haxTogglePanel = togglePanel;
	updateVisibility();
	setInterval(updateVisibility, 1000);
};
