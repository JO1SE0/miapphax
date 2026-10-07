// fx.ts
// Efectos visuales y de ambiente (solo del lado del cliente, no tocan la partida):
//  * banner de gol animado + destello del color del equipo
//  * "camara lenta" falsa: vineta oscura y un zoom corto despues del gol (visual, el juego sigue normal)
//  * borde que late en los ultimos segundos del partido
//  * entrada animada al abrir la app
//  * escudo muy tenue en el fondo del menu (lo usa bg.ts)
// Se apagan con Low Latency (esos modos buscan el minimo trabajo de dibujo).
// Detecta el gol mirando el marcador del juego: [data-hook=red-score] y [data-hook=blue-score].

import { BRAND_LOGO } from "./brand";
import { playSound } from "./extras";

export type FxConfig = {
	enabled: boolean;
	banner: boolean;
	cinematic: boolean; // vineta + zoom corto
	edge: boolean; // borde en los ultimos segundos
	splash: boolean;
	lowLatency: boolean;
	logo: string;
};

export const FX_DEFAULTS: FxConfig = {
	enabled: true,
	banner: true,
	cinematic: true,
	edge: true,
	splash: true,
	lowLatency: false,
	logo: "",
};

let cfg: FxConfig = { ...FX_DEFAULTS };
export const getFx = (): FxConfig => ({ ...cfg });
export const updateFx = (partial: Partial<FxConfig>): void => {
	cfg = { ...cfg, ...partial };
};

export const readFx = (prefs: any): FxConfig => ({
	enabled: prefs?.fx_enabled ?? FX_DEFAULTS.enabled,
	banner: prefs?.fx_banner ?? FX_DEFAULTS.banner,
	cinematic: prefs?.fx_cinematic ?? FX_DEFAULTS.cinematic,
	edge: prefs?.fx_edge ?? FX_DEFAULTS.edge,
	splash: prefs?.fx_splash ?? FX_DEFAULTS.splash,
	lowLatency: prefs?.low_latency === true,
	logo: typeof prefs?.club_logo === "string" && prefs.club_logo ? prefs.club_logo : "",
});

const TEAM = {
	red: { name: "ROJO", color: "#e56e56" },
	blue: { name: "AZUL", color: "#5689e5" },
};

const STYLE_ID = "hax-fx-style";
const CSS = `
@keyframes hxfx-banner { 0% { transform: translate(-50%, -140%); opacity: 0; } 14% { transform: translate(-50%, 0); opacity: 1; } 78% { transform: translate(-50%, 0); opacity: 1; } 100% { transform: translate(-50%, -140%); opacity: 0; } }
@keyframes hxfx-flash { 0% { opacity: 0; } 12% { opacity: 1; } 100% { opacity: 0; } }
@keyframes hxfx-vig { 0% { opacity: 0; } 20% { opacity: 1; } 75% { opacity: 1; } 100% { opacity: 0; } }
@keyframes hxfx-edge { 0%, 100% { opacity: .25; } 50% { opacity: 1; } }
@keyframes hxfx-splash-logo { 0% { transform: scale(.7); opacity: 0; filter: drop-shadow(0 0 0 rgba(208,184,120,0)); } 40% { transform: scale(1); opacity: 1; filter: drop-shadow(0 0 28px rgba(208,184,120,.65)); } 100% { transform: scale(1.04); opacity: 1; filter: drop-shadow(0 0 40px rgba(208,184,120,.5)); } }
@keyframes hxfx-splash-out { 0%, 70% { opacity: 1; } 100% { opacity: 0; } }
#hxfx-layer { position: fixed; inset: 0; z-index: 2147482000; pointer-events: none; overflow: hidden; }
#hxfx-layer .hxfx-banner { position: absolute; top: 74px; left: 50%; display: flex; align-items: center; gap: 14px; padding: 10px 26px 10px 14px; border-radius: 14px; color: #fff;
	background: linear-gradient(180deg, rgba(23,41,74,.96), rgba(8,16,31,.96)); border: 1px solid rgba(208,184,120,.55); box-shadow: 0 10px 40px rgba(0,0,0,.5), 0 0 0 3px var(--c, #d0b878) inset;
	font-family: Outfit, Inter, "Segoe UI", sans-serif; animation: hxfx-banner 2.6s cubic-bezier(.2,.8,.2,1) forwards; }
#hxfx-layer .hxfx-banner img { width: 46px; height: 46px; object-fit: contain; }
#hxfx-layer .hxfx-banner b { display: block; font-size: 30px; font-weight: 800; letter-spacing: .12em; line-height: 1; background: linear-gradient(180deg,#fff,#d0b878); -webkit-background-clip: text; background-clip: text; color: transparent; }
#hxfx-layer .hxfx-banner span { display: block; margin-top: 4px; font-size: 14px; font-weight: 600; letter-spacing: .08em; color: var(--c, #d0b878); }
#hxfx-layer .hxfx-flash { position: absolute; inset: 0; animation: hxfx-flash .9s ease-out forwards; }
#hxfx-layer .hxfx-vig { position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 45%, rgba(4,8,18,.72) 100%); animation: hxfx-vig 1.8s ease-in-out forwards; }
#hxfx-layer .hxfx-edge { position: absolute; inset: 0; box-shadow: inset 0 0 70px 10px rgba(224,8,16,.6); animation: hxfx-edge .8s ease-in-out infinite; }
#hxfx-splash { position: fixed; inset: 0; z-index: 2147483600; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; pointer-events: none;
	background: radial-gradient(circle at 50% 40%, #203860, #08101f 75%); animation: hxfx-splash-out 2.2s ease forwards; }
#hxfx-splash img { width: 150px; height: 150px; object-fit: contain; animation: hxfx-splash-logo 1.4s ease-out forwards; }
#hxfx-splash div { font: 800 26px Outfit, Inter, "Segoe UI", sans-serif; letter-spacing: .3em; text-transform: uppercase; background: linear-gradient(180deg,#fff,#d0b878); -webkit-background-clip: text; background-clip: text; color: transparent; }
`;

const ensure = (): HTMLElement => {
	if (!document.getElementById(STYLE_ID)) {
		const style = document.createElement("style");
		style.id = STYLE_ID;
		style.textContent = CSS;
		document.head.appendChild(style);
	}
	let layer = document.getElementById("hxfx-layer");
	if (!layer) {
		layer = document.createElement("div");
		layer.id = "hxfx-layer";
		document.body.appendChild(layer);
	}
	return layer;
};

const active = (): boolean => cfg.enabled && !cfg.lowLatency;
const crest = (): string => cfg.logo || BRAND_LOGO;

const spawn = (node: HTMLElement, ms: number): void => {
	ensure().appendChild(node);
	setTimeout(() => node.remove(), ms);
};

let zoomTimer: number | undefined;
const slowZoom = (): void => {
	const frame = document.getElementsByClassName("gameframe")[0] as HTMLElement | undefined;
	if (!frame) return;
	frame.style.transition = "transform .7s ease-out";
	frame.style.transform = "scale(1.03)";
	clearTimeout(zoomTimer);
	zoomTimer = window.setTimeout(() => {
		frame.style.transition = "transform 1s ease-in-out";
		frame.style.transform = "";
		setTimeout(() => { frame.style.transition = ""; }, 1100);
	}, 900);
};

export const showGoal = (team: "red" | "blue", red: number, blue: number): void => {
	const t = TEAM[team];
	if (cfg.banner) {
		const flash = document.createElement("div");
		flash.className = "hxfx-flash";
		flash.style.background = `radial-gradient(circle at 50% 30%, ${t.color}66, transparent 70%)`;
		spawn(flash, 1000);
		const banner = document.createElement("div");
		banner.className = "hxfx-banner";
		banner.style.setProperty("--c", t.color);
		const img = document.createElement("img");
		img.src = crest();
		img.alt = "";
		const text = document.createElement("div");
		const big = document.createElement("b");
		big.textContent = "¡GOOOL!";
		const small = document.createElement("span");
		small.textContent = `${t.name}  ·  ${red} - ${blue}`;
		text.append(big, small);
		banner.append(img, text);
		spawn(banner, 2700);
	}
	if (cfg.cinematic) {
		const vig = document.createElement("div");
		vig.className = "hxfx-vig";
		spawn(vig, 1900);
		slowZoom();
	}
};

export const showSplash = (): void => {
	if (!active() || !cfg.splash || document.getElementById("hxfx-splash")) return;
	ensure();
	const box = document.createElement("div");
	box.id = "hxfx-splash";
	const img = document.createElement("img");
	img.src = crest();
	img.alt = "";
	const text = document.createElement("div");
	text.textContent = "TL App";
	box.append(img, text);
	document.body.appendChild(box);
	setTimeout(() => box.remove(), 2300);
};

// ---- vigilancia del marcador y del reloj -----------------------------------------

let lastRed: number | null = null;
let lastBlue: number | null = null;
let lastSecs: number | null = null;
let edgeEl: HTMLElement | null = null;

const readNum = (doc: Document, hook: string): number | null => {
	const t = doc.querySelector(`[data-hook=${hook}]`)?.textContent;
	const n = parseInt((t || "").trim(), 10);
	return Number.isFinite(n) ? n : null;
};

// Segundos que marca el reloj ("mm:ss" en .digit); null si no se entiende
export const readClock = (doc: Document): number | null => {
	const digits = Array.from(doc.querySelectorAll(".game-timer-view .digit")).map((d) => (d.textContent || "").trim());
	if (digits.length < 4 || digits.some((d) => !/^\d$/.test(d))) return null;
	return (Number(digits[0]) * 10 + Number(digits[1])) * 60 + Number(digits[2]) * 10 + Number(digits[3]);
};

export const shouldPulse = (prev: number | null, now: number | null): boolean =>
	prev !== null && now !== null && now > 0 && now <= 15 && now <= prev;

const setEdge = (on: boolean): void => {
	if (on && !edgeEl) {
		edgeEl = document.createElement("div");
		edgeEl.className = "hxfx-edge";
		ensure().appendChild(edgeEl);
	} else if (!on && edgeEl) {
		edgeEl.remove();
		edgeEl = null;
	}
};

const tick = (): void => {
	let doc: Document | null = null;
	try {
		const frame = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement | undefined;
		doc = frame?.contentDocument ?? null;
	} catch { /* sin acceso */ }
	if (!doc?.body) return;

	const red = readNum(doc, "red-score");
	const blue = readNum(doc, "blue-score");
	if (red !== null && blue !== null) {
		if (lastRed !== null && lastBlue !== null) {
			const team = red > lastRed ? "red" : blue > lastBlue ? "blue" : null;
			if (team) {
				if (active()) showGoal(team, red, blue);
				if (cfg.enabled) playSound("goal");
			}
		}
		lastRed = red;
		lastBlue = blue;
	} else {
		lastRed = lastBlue = null; // salio de la partida
	}

	const secs = readClock(doc);
	const pulse = active() && cfg.edge && shouldPulse(lastSecs, secs);
	setEdge(pulse);
	lastSecs = secs;
};

export const startFx = async (): Promise<void> => {
	try {
		cfg = readFx(await window.electronAPI.getAppPreferences());
	} catch { /* valores por defecto */ }
	showSplash();
	setInterval(tick, 500);
};
