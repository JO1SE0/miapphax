// fx.ts
// Efectos visuales y de ambiente (solo del lado del cliente, no tocan la partida):
//  * banner de gol animado + destello del color del equipo
//  * "camara lenta" falsa: vineta oscura y un zoom corto despues del gol (visual, el juego sigue normal)
//  * borde que late en los ultimos segundos del partido
//  * entrada animada al abrir la app
//  * escudo muy tenue en el fondo del menu (lo usa bg.ts)
// Se apagan con el "Modo FPS maximo" del panel (Rendimiento).
// Detecta el gol mirando el marcador del juego: [data-hook=red-score] y [data-hook=blue-score].

import { BRAND_LOGO } from "./brand";
import { playSound } from "./extras";

export type FxConfig = {
	enabled: boolean;
	banner: boolean;
	cinematic: boolean; // vineta + zoom corto
	edge: boolean; // borde en los ultimos segundos
	splash: boolean;
	splashSound: boolean;
	lowLatency: boolean;
	logo: string;
	redColor: string;
	blueColor: string;
};

export const FX_DEFAULTS: FxConfig = {
	enabled: true,
	banner: true,
	cinematic: true,
	edge: true,
	splash: true,
	splashSound: true,
	lowLatency: false,
	logo: "",
	redColor: "#e56e56",
	blueColor: "#5689e5",
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
	splashSound: prefs?.fx_splash_sound ?? FX_DEFAULTS.splashSound,
	lowLatency: prefs?.fps_mode === true, // "modo FPS maximo": apaga los efectos
	logo: typeof prefs?.club_logo === "string" && prefs.club_logo ? prefs.club_logo : "",
	redColor: /^#[0-9a-f]{6}$/i.test(prefs?.fx_red_color) ? prefs.fx_red_color : FX_DEFAULTS.redColor,
	blueColor: /^#[0-9a-f]{6}$/i.test(prefs?.fx_blue_color) ? prefs.fx_blue_color : FX_DEFAULTS.blueColor,
});

const teamStyle = (team: "red" | "blue") => ({
	name: team === "red" ? "ROJO" : "AZUL",
	color: team === "red" ? cfg.redColor : cfg.blueColor,
});

const STYLE_ID = "hax-fx-style";
const CSS = `
@keyframes hxfx-banner { 0% { transform: translate(-50%, -140%); opacity: 0; } 14% { transform: translate(-50%, 0); opacity: 1; } 78% { transform: translate(-50%, 0); opacity: 1; } 100% { transform: translate(-50%, -140%); opacity: 0; } }
@keyframes hxfx-flash { 0% { opacity: 0; } 18% { opacity: 1; } 100% { opacity: 0; } }
@keyframes hxfx-score-pulse { 0% { opacity: 0; transform: scale(.9); } 30% { opacity: 1; transform: scale(1.08); } 100% { opacity: 0; transform: scale(1.2); } }
@keyframes hxfx-vig { 0% { opacity: 0; } 20% { opacity: 1; } 75% { opacity: 1; } 100% { opacity: 0; } }
@keyframes hxfx-edge { 0%, 100% { opacity: .25; } 50% { opacity: 1; } }
@keyframes hxfx-splash-logo { 0% { transform: scale(.84); opacity: 0; filter: drop-shadow(0 0 0 rgba(208,184,120,0)); } 48% { transform: scale(1); opacity: 1; filter: drop-shadow(0 0 24px rgba(208,184,120,.45)); } 100% { transform: scale(1.025); opacity: 1; filter: drop-shadow(0 0 32px rgba(208,184,120,.3)); } }
@keyframes hxfx-splash-in-out { 0% { opacity: 0; } 14%, 74% { opacity: 1; } 100% { opacity: 0; } }
#hxfx-layer { position: fixed; inset: 0; z-index: 2147482000; pointer-events: none; overflow: hidden; }
#hxfx-layer .hxfx-banner { position: absolute; top: 74px; left: 50%; display: flex; align-items: center; gap: 14px; padding: 10px 26px 10px 14px; border-radius: 14px; color: #fff;
	background: linear-gradient(180deg, rgba(23,41,74,.96), rgba(8,16,31,.96)); border: 1px solid rgba(208,184,120,.55); box-shadow: 0 10px 40px rgba(0,0,0,.5), 0 0 0 3px var(--c, #d0b878) inset;
	font-family: Outfit, Inter, "Segoe UI", sans-serif; animation: hxfx-banner 2.6s cubic-bezier(.2,.8,.2,1) forwards; }
#hxfx-layer .hxfx-banner img { width: 46px; height: 46px; object-fit: contain; }
#hxfx-layer .hxfx-banner b { display: block; font-size: 30px; font-weight: 800; letter-spacing: .12em; line-height: 1; background: linear-gradient(180deg,#fff,#d0b878); -webkit-background-clip: text; background-clip: text; color: transparent; }
#hxfx-layer .hxfx-banner span { display: block; margin-top: 4px; font-size: 14px; font-weight: 600; letter-spacing: .08em; color: var(--c, #d0b878); }
#hxfx-layer .hxfx-flash { position: absolute; border: 1px solid var(--c, #d0b878); background: linear-gradient(180deg, rgba(255,255,255,.035), transparent 45%); box-shadow: inset 0 0 46px rgba(255,255,255,.07), 0 0 28px var(--c, #d0b878); animation: hxfx-flash .8s ease-out forwards; }
#hxfx-layer .hxfx-score-pulse { position: absolute; border: 2px solid var(--c, #d0b878); border-radius: 12px; box-shadow: 0 0 18px var(--c, #d0b878); animation: hxfx-score-pulse .65s ease-out forwards; }
#hxfx-layer .hxfx-vig { position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 45%, rgba(4,8,18,.72) 100%); animation: hxfx-vig 1.8s ease-in-out forwards; }
#hxfx-layer .hxfx-edge { position: absolute; inset: 0; box-shadow: inset 0 0 70px 10px rgba(224,8,16,.6); animation: hxfx-edge .8s ease-in-out infinite; }
#hxfx-splash { position: fixed; inset: 0; z-index: 2147483600; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; pointer-events: none;
	background: radial-gradient(ellipse at 50% 42%, rgba(45,79,138,.72), rgba(8,16,31,.98) 68%); animation: hxfx-splash-in-out 1.9s cubic-bezier(.22,.68,.18,1) forwards; }
#hxfx-splash img { width: 132px; height: 132px; object-fit: contain; animation: hxfx-splash-logo 1.25s cubic-bezier(.2,.8,.2,1) both; }
#hxfx-splash div { font: 800 24px Outfit, Inter, "Segoe UI", sans-serif; letter-spacing: .28em; text-transform: uppercase; background: linear-gradient(180deg,#fff,#d0b878); -webkit-background-clip: text; background-clip: text; color: transparent; }
#hxfx-splash small { margin-top: -10px; color: rgba(225,233,245,.62); font: 600 10px Inter, "Segoe UI", sans-serif; letter-spacing: .24em; text-transform: uppercase; }
@media (prefers-reduced-motion: reduce) {
	#hxfx-splash, #hxfx-splash img, #hxfx-layer .hxfx-banner, #hxfx-layer .hxfx-flash, #hxfx-layer .hxfx-score-pulse, #hxfx-layer .hxfx-vig, #hxfx-layer .hxfx-edge { animation-duration: .01ms !important; }
}
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

export const playStartupSound = (preview = false): void => {
	if (!preview && !cfg.splashSound) return;
	const AudioContextClass = window.AudioContext;
	if (!AudioContextClass) {
		console.error("Web Audio is not available; the startup sound cannot be played.");
		return;
	}

	const context = new AudioContextClass();
	const master = context.createGain();
	const start = context.currentTime + 0.04;
	master.gain.setValueAtTime(0.0001, start);
	master.gain.linearRampToValueAtTime(0.16, start + 0.12);
	master.gain.setValueAtTime(0.16, start + 0.42);
	master.gain.exponentialRampToValueAtTime(0.0001, start + 1.05);
	master.connect(context.destination);

	[
		{ frequency: 392, at: 0 },
		{ frequency: 587.33, at: 0.12 },
		{ frequency: 783.99, at: 0.28 },
	].forEach(({ frequency, at }) => {
		const oscillator = context.createOscillator();
		const envelope = context.createGain();
		oscillator.type = "sine";
		oscillator.frequency.setValueAtTime(frequency, start + at);
		envelope.gain.setValueAtTime(0.0001, start + at);
		envelope.gain.linearRampToValueAtTime(0.34, start + at + 0.035);
		envelope.gain.exponentialRampToValueAtTime(0.0001, start + at + 0.72);
		oscillator.connect(envelope);
		envelope.connect(master);
		oscillator.start(start + at);
		oscillator.stop(start + at + 0.74);
		oscillator.addEventListener("ended", () => {
			oscillator.disconnect();
			envelope.disconnect();
		}, { once: true });
	});

	window.setTimeout(() => {
		void context.close().catch((error) => console.error("Failed to close startup sound audio context:", error));
	}, 1400);
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
	if (!active()) return;
	const t = teamStyle(team);
	if (cfg.banner) {
		const frame = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement | undefined;
		const frameRect = frame?.getBoundingClientRect();
		const flash = document.createElement("div");
		flash.className = "hxfx-flash";
		flash.style.setProperty("--c", t.color);
		if (frameRect) {
			flash.style.left = `${frameRect.left}px`;
			flash.style.top = `${frameRect.top}px`;
			flash.style.width = `${frameRect.width}px`;
			flash.style.height = `${frameRect.height}px`;
			flash.style.borderRadius = "12px";
			spawn(flash, 850);
		}
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
		pulseScore(team, t.color);
	}
	if (cfg.cinematic) {
		const vig = document.createElement("div");
		vig.className = "hxfx-vig";
		spawn(vig, 1900);
		slowZoom();
	}
};

const pulseScore = (team: "red" | "blue", color: string): void => {
	const frame = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement | undefined;
	const doc = frame?.contentDocument;
	const score = doc?.querySelector<HTMLElement>(`[data-hook="${team}-score"]`);
	const rect = score?.getBoundingClientRect();
	const frameRect = frame?.getBoundingClientRect();
	if (!rect || !frameRect || rect.width <= 0 || rect.height <= 0) return;

	const scaleX = frameRect.width / (frame?.clientWidth || frameRect.width);
	const scaleY = frameRect.height / (frame?.clientHeight || frameRect.height);
	const pulse = document.createElement("div");
	pulse.className = "hxfx-score-pulse";
	pulse.style.setProperty("--c", color);
	pulse.style.left = `${frameRect.left + rect.left * scaleX - 8}px`;
	pulse.style.top = `${frameRect.top + rect.top * scaleY - 5}px`;
	pulse.style.width = `${rect.width * scaleX + 16}px`;
	pulse.style.height = `${rect.height * scaleY + 10}px`;
	spawn(pulse, 700);
};

export const showSplash = (): void => {
	if (!active() || !cfg.splash || document.getElementById("hxfx-splash")) return;
	ensure();
	playStartupSound();
	const box = document.createElement("div");
	box.id = "hxfx-splash";
	const img = document.createElement("img");
	img.src = crest();
	img.alt = "";
	const text = document.createElement("div");
	text.textContent = "TL App";
	const sub = document.createElement("small");
	sub.textContent = "Toda la Lecce · HaxBall";
	box.append(img, text, sub);
	document.body.appendChild(box);
	setTimeout(() => box.remove(), 2050);
};

// ---- vigilancia del marcador y del reloj -----------------------------------------

let lastRed: number | null = null;
let lastBlue: number | null = null;
let lastSecs: number | null = null;
let edgeEl: HTMLElement | null = null;
let observedScoreboard: Element | null = null;
let scoreObserver: MutationObserver | null = null;

const readNum = (doc: Document, hook: string): number | null => {
	const t = doc.querySelector(`[data-hook=${hook}]`)?.textContent;
	const n = parseInt((t || "").trim(), 10);
	return Number.isFinite(n) ? n : null;
};

const checkScore = (doc: Document): void => {
	const red = readNum(doc, "red-score");
	const blue = readNum(doc, "blue-score");
	if (red !== null && blue !== null) {
		if (lastRed !== null && lastBlue !== null) {
			const team = red > lastRed ? "red" : blue > lastBlue ? "blue" : null;
			if (team) {
				if (active()) {
					showGoal(team, red, blue);
					playSound("goal");
				}
			}
		}
		lastRed = red;
		lastBlue = blue;
	} else {
		lastRed = lastBlue = null;
	}
};

const observeScoreboard = (doc: Document): void => {
	const scoreboard = doc.querySelector(".scoreboard");
	if (scoreboard === observedScoreboard) return;

	scoreObserver?.disconnect();
	scoreObserver = null;
	observedScoreboard = scoreboard;
	lastRed = lastBlue = null;

	if (scoreboard) {
		scoreObserver = new MutationObserver(() => checkScore(doc));
		scoreObserver.observe(scoreboard, { childList: true, characterData: true, subtree: true });
	}
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

	observeScoreboard(doc);
	checkScore(doc);

	const secs = readClock(doc);
	const pulse = active() && cfg.edge && shouldPulse(lastSecs, secs);
	setEdge(pulse);
	lastSecs = secs;
};

export const startFx = async (): Promise<void> => {
	try {
		cfg = readFx(await window.electronAPI.getAppPreferences());
	} catch (error) {
		console.error("Failed to load visual effects preferences:", error);
	}
	showSplash();
	setInterval(tick, 1000);
};
