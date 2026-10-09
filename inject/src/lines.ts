import { COS_DEFAULTS, installCosmetics } from "./cosmetics";
import type { CosConfig } from "./cosmetics";

// lines.ts
// Parches del canvas del juego: grosor de lineas, cancha plana y canvas de baja latencia.
//
// Como funciona: HaxBall dibuja todo en un <canvas> dentro del iframe ".gameframe".
// Reemplazamos algunos metodos del CanvasRenderingContext2D de ESE iframe:
//
//  * stroke()        -> grosor segun lo que se dibuja (cancha / pelota / jugadores)
//  * createPattern() -> recuerda que patrones vienen de una IMAGEN (pasto, cemento)
//  * fill()/fillRect -> si el relleno es uno de esos patrones, usa un color plano
//  * getContext()    -> opcional: pide un canvas "desynchronized" (menos latencia)
//
// El juego fija el ancho antes de cada grupo de dibujo:
//   3 -> cancha, segmentos, joints, halo   (grupo "field")
//   2 -> discos                            (grupo "ball" o "players")
// Los jugadores se rellenan con un CanvasPattern creado desde un CANVAS (su avatar),
// el pasto/cemento desde una IMAGEN, y la pelota con un color: asi se distinguen.

export type LinesConfig = CosConfig & {
	enabled: boolean;
	field: number;
	ball: number;
	players: number;
	debug: boolean;
	flatPitch: boolean; // cancha sin textura
	flatColor: string; // "" = automatico (promedio de la textura)
	desync: boolean; // canvas de baja latencia (solo salas nuevas)
	bgEnabled: boolean; // degradé en vez del pasto verde de afuera
	bgFrom: string;
	bgTo: string;
	bgAnim: boolean; // degradé que se mueve despacio
	bgCrest: boolean; // escudo muy tenue en el fondo del menu
};

// Valores originales del juego (tambien son los que se usan al apagar el modo).
export const ORIGINAL_WIDTHS = { field: 3, ball: 2, players: 2 };

// Anchos "crudos" que setea el juego antes de dibujar cada grupo.
const RAW_FIELD = 3;
const RAW_DISC = 2;

// Color de respaldo si no se puede leer la textura (pasto de HaxBall, aprox.)
const FALLBACK_FLAT = "#718c5a";

export const DEFAULT_CONFIG: LinesConfig = {
	enabled: true,
	field: 1.5,
	ball: 1,
	players: 1,
	debug: false,
	flatPitch: false,
	flatColor: "",
	desync: false,
	bgEnabled: true,
	bgFrom: "#203860",
	bgTo: "#08101f",
	bgAnim: false,
	bgCrest: true,
	trajectoryEnabled: false,
	trajectoryLength: 600,
	trajectoryColor: "#d0b878",
	trajectoryWidth: 2,
	...COS_DEFAULTS,
};

// ¿Es un color de texto tipo pasto (verde)? Los patrones se detectan aparte.
const isGreenish = (style: any): boolean => {
	if (typeof style !== "string") return false;
	let r = 0, g = 0, b = 0;
	const hex = style.trim().match(/^#([0-9a-f]{6})$/i);
	const rgb = style.match(/rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/i);
	if (hex) { r = parseInt(hex[1].slice(0, 2), 16); g = parseInt(hex[1].slice(2, 4), 16); b = parseInt(hex[1].slice(4), 16); }
	else if (rgb) { r = +rgb[1]; g = +rgb[2]; b = +rgb[3]; }
	else return false;
	return g > r + 12 && g > b + 12;
};

const PATCH_FLAG = "__haxLinesPatched";
const CONFIG_KEY = "__haxLines";

// Devuelve el ancho a usar, o null si hay que dejar el trazo como esta.
export const pickWidth = (
	raw: number,
	isPattern: boolean,
	cfg: LinesConfig
): number | null => {
	if (raw === RAW_DISC) {
		return isPattern ? cfg.players : cfg.ball;
	}
	if (raw === RAW_FIELD) {
		return cfg.field;
	}
	return null;
};

// Color promedio de una imagen (para reemplazar su textura por un color liso).
export const averageColor = (win: any, image: any): string => {
	try {
		const size = 16;
		const canvas = win.document.createElement("canvas");
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext("2d");
		ctx.drawImage(image, 0, 0, size, size);
		const data = ctx.getImageData(0, 0, size, size).data;
		let r = 0, g = 0, b = 0, n = 0;
		for (let i = 0; i < data.length; i += 4) {
			if (data[i + 3] === 0) continue;
			r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
		}
		if (n === 0) return FALLBACK_FLAT;
		const hex = (v: number) => Math.round(v / n).toString(16).padStart(2, "0");
		return `#${hex(r)}${hex(g)}${hex(b)}`;
	} catch {
		return FALLBACK_FLAT; // imagen "tainted" o aun no cargada
	}
};

// Instala el parche en la ventana (window) del iframe. Seguro de llamar varias veces.
export const installLinePatch = (win: any): boolean => {
	if (!win) return false;
	if (win[PATCH_FLAG]) return true;

	const proto = win.CanvasRenderingContext2D?.prototype;
	if (!proto || typeof proto.stroke !== "function") return false;

	const originalStroke = proto.stroke;
	const seen = new Set<string>();
	win[CONFIG_KEY] = { ...DEFAULT_CONFIG };

	// ---- stroke: grosor de lineas -------------------------------------------
	proto.stroke = function (this: any, ...args: any[]) {
		if (this.__hxTrajectoryDrawing) return originalStroke.apply(this, args);
		const cfg: LinesConfig | undefined = win[CONFIG_KEY];
		if (!cfg || cfg.lowPerformance || (!cfg.enabled && !cfg.debug)) {
			return originalStroke.apply(this, args);
		}

		const raw = this.lineWidth;
		const isPattern =
			typeof win.CanvasPattern === "function" &&
			this.fillStyle instanceof win.CanvasPattern;

		if (cfg.debug) {
			const key = `lineWidth=${raw} fill=${isPattern ? "pattern" : typeof this.fillStyle} stroke=${this.strokeStyle}`;
			if (!seen.has(key)) {
				seen.add(key);
				console.log("[haxlines]", key);
			}
		}

		if (!cfg.enabled) {
			return originalStroke.apply(this, args);
		}

		const width = pickWidth(raw, isPattern, cfg);
		if (width === null) {
			return originalStroke.apply(this, args);
		}
		if (width <= 0) {
			return; // 0 = linea invisible
		}

		this.lineWidth = width;
		try {
			return originalStroke.apply(this, args);
		} finally {
			this.lineWidth = raw;
		}
	};

	// ---- cancha plana: patrones que vienen de una imagen ---------------------
	if (typeof proto.createPattern === "function" && typeof proto.fill === "function") {
		const originalCreatePattern = proto.createPattern;
		const originalFill = proto.fill;
		const originalFillRect = proto.fillRect;
		const textures = new WeakMap<object, any>(); // patron -> imagen origen
		const colorOfImage = new WeakMap<object, string>();

		proto.createPattern = function (this: any, image: any, repetition: any) {
			const pattern = originalCreatePattern.call(this, image, repetition);
			const isImage =
				typeof win.HTMLImageElement === "function" && image instanceof win.HTMLImageElement;
			if (pattern && isImage) textures.set(pattern, image);
			return pattern;
		};

		// Si el relleno actual es una textura y la cancha plana esta activa,
		// ejecuta la operacion con un color liso y despues restaura el patron.
		const withFlatFill = (ctx: any, run: () => any): any => {
			const cfg: LinesConfig | undefined = win[CONFIG_KEY];
			if (cfg?.flatPitch && !cfg.lowPerformance) {
				const style = ctx.fillStyle;
				const image = typeof style === "object" && style ? textures.get(style) : undefined;
				if (image) {
					let color = cfg.flatColor;
					if (!color) {
						color = colorOfImage.get(image) as string;
						if (!color) {
							color = averageColor(win, image);
							colorOfImage.set(image, color);
						}
					}
					ctx.fillStyle = color;
					try {
						return run();
					} finally {
						ctx.fillStyle = style;
					}
				}
			}
			return run();
		};

		proto.fill = function (this: any, ...args: any[]) {
			return withFlatFill(this, () => originalFill.apply(this, args));
		};
		if (typeof originalFillRect === "function") {
			proto.fillRect = function (this: any, ...args: any[]) {
				// Fondo de afuera de la cancha: rect completo del canvas relleno con pasto.
				const cfg: LinesConfig | undefined = win[CONFIG_KEY];
				const canvas = this.canvas;
				if (
					cfg?.bgEnabled &&
					!cfg.lowPerformance &&
					canvas &&
					args[0] === 0 &&
					args[1] === 0 &&
					args[2] >= canvas.width &&
					args[3] >= canvas.height &&
					(textures.has(this.fillStyle) || isGreenish(this.fillStyle))
				) {
					const style = this.fillStyle;
					const g = this.createLinearGradient(0, 0, canvas.width * 0.35, canvas.height);
					g.addColorStop(0, cfg.bgFrom);
					g.addColorStop(1, cfg.bgTo);
					this.fillStyle = g;
					try {
						return originalFillRect.apply(this, args);
					} finally {
						this.fillStyle = style;
					}
				}
				return withFlatFill(this, () => originalFillRect.apply(this, args));
			};
		}
	}

	// ---- canvas de baja latencia (solo afecta contextos creados despues) ----
	const canvasProto = win.HTMLCanvasElement?.prototype;
	if (canvasProto && typeof canvasProto.getContext === "function") {
		const originalGetContext = canvasProto.getContext;
		canvasProto.getContext = function (this: any, type: any, options: any, ...rest: any[]) {
			const cfg: LinesConfig | undefined = win[CONFIG_KEY];
			if (cfg?.desync && type === "2d") {
				options = { ...(options || {}), desynchronized: true };
			}
			return originalGetContext.call(this, type, options, ...rest);
		};
	}

	installCosmetics(win, () => win[CONFIG_KEY]);

	win[PATCH_FLAG] = true;
	return true;
};

export const writeConfig = (win: any, cfg: LinesConfig): void => {
	if (win) win[CONFIG_KEY] = { ...cfg };
};

// ---------------------------------------------------------------------------
// Parte que usa el navegador (preferencias + iframe). No se usa en los tests.
// ---------------------------------------------------------------------------

let current: LinesConfig = { ...DEFAULT_CONFIG };

const num = (value: any, fallback: number): number => {
	const n = Number(value);
	return Number.isFinite(n) && n >= 0 ? n : fallback;
};

const clampScale = (v: any): number => {
	const n = Number(v);
	return Number.isFinite(n) ? Math.min(1.6, Math.max(0.5, n)) : 1;
};

const readConfigFromPrefs = (prefs: any): LinesConfig => ({
	enabled: prefs?.lines_enabled ?? DEFAULT_CONFIG.enabled,
	field: num(prefs?.line_width_field, DEFAULT_CONFIG.field),
	ball: num(prefs?.line_width_ball, DEFAULT_CONFIG.ball),
	players: num(prefs?.line_width_players, DEFAULT_CONFIG.players),
	debug: current.debug,
	flatPitch: prefs?.pitch_flat ?? DEFAULT_CONFIG.flatPitch,
	flatColor: typeof prefs?.pitch_flat_color === "string" ? prefs.pitch_flat_color : "",
	desync: prefs?.canvas_desync ?? DEFAULT_CONFIG.desync,
	bgEnabled: prefs?.bg_enabled ?? DEFAULT_CONFIG.bgEnabled,
	bgFrom: /^#[0-9a-f]{6}$/i.test(prefs?.bg_from) ? prefs.bg_from : DEFAULT_CONFIG.bgFrom,
	bgTo: /^#[0-9a-f]{6}$/i.test(prefs?.bg_to) ? prefs.bg_to : DEFAULT_CONFIG.bgTo,
	bgAnim: prefs?.bg_anim === true,
	bgCrest: prefs?.bg_crest ?? true,
	trajectoryEnabled: prefs?.trajectory_enabled === true,
	trajectoryLength: Math.min(1500, Math.max(150, num(prefs?.trajectory_length, DEFAULT_CONFIG.trajectoryLength))),
	trajectoryColor: /^#[0-9a-f]{6}$/i.test(prefs?.trajectory_color) ? prefs.trajectory_color : DEFAULT_CONFIG.trajectoryColor,
	trajectoryWidth: Math.min(5, Math.max(1, num(prefs?.trajectory_width, DEFAULT_CONFIG.trajectoryWidth))),
	assistShotAngles: prefs?.assist_shot_angles === true,
	assistPassLines: prefs?.assist_pass_lines === true,
	assistBallDistance: prefs?.assist_ball_distance === true,
	assistBlockedShot: prefs?.assist_blocked_shot === true,
	assistTeamMode: ["auto", "red", "blue"].includes(prefs?.assist_team_mode) ? prefs.assist_team_mode : DEFAULT_CONFIG.assistTeamMode,
	assistAttackDirection: ["auto", "left", "right"].includes(prefs?.assist_attack_direction) ? prefs.assist_attack_direction : DEFAULT_CONFIG.assistAttackDirection,
	wmEnabled: prefs?.wm_enabled === true,
	wmOpacity: Math.min(0.5, Math.max(0.02, Number(prefs?.wm_opacity) || COS_DEFAULTS.wmOpacity)),
	wmSize: Math.min(400, Math.max(60, Number(prefs?.wm_size) || COS_DEFAULTS.wmSize)),
	wmLogo: typeof prefs?.club_logo === "string" ? prefs.club_logo : "",
	cosEnabled: prefs?.vis_enabled ?? COS_DEFAULTS.cosEnabled,
	myScale: clampScale(prefs?.vis_my_scale),
	ballScale: clampScale(prefs?.vis_ball_scale),
	ballColor: /^#[0-9a-f]{6}$/i.test(prefs?.vis_ball_color) ? prefs.vis_ball_color : "",
	ballTrail: prefs?.vis_ball_trail === true,
	lowPerformance: prefs?.fps_mode === true,
});

const getGameWindow = (): any => {
	const frame = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement | undefined;
	try {
		return frame?.contentWindow ?? null;
	} catch {
		return null;
	}
};

let observedFrame: HTMLIFrameElement | null = null;

const pushToGame = (): void => {
	const win = getGameWindow();
	if (!win) return;
	const fresh = !win[PATCH_FLAG];
	if (installLinePatch(win) && fresh) {
		writeConfig(win, current);
	}
};

export const getLinesConfig = (): LinesConfig => ({ ...current });

// Cambia valores en vivo (sin guardar). Lo usan los sliders mientras se arrastran.
export const updateLinesLive = (partial: Partial<LinesConfig>): void => {
	current = { ...current, ...partial };
	const win = getGameWindow();
	if (win && installLinePatch(win)) {
		writeConfig(win, current);
	}
};

const toast = (text: string): void => {
	const id = "hax-lines-toast";
	document.getElementById(id)?.remove();
	const el = document.createElement("div");
	el.id = id;
	el.textContent = text;
	el.style.cssText =
		"position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483647;" +
		"padding:6px 14px;border-radius:6px;background:rgba(17,22,25,0.9);color:#fff;" +
		"font:bold 13px sans-serif;pointer-events:none;";
	document.body.appendChild(el);
	setTimeout(() => el.remove(), 1200);
};

export const toggleCosmetics = async (): Promise<void> => {
	const cosEnabled = !current.cosEnabled;
	updateLinesLive({ cosEnabled });
	await window.electronAPI.setAppPreference("vis_enabled", cosEnabled);
	toast(cosEnabled ? "Extras visuales: ON" : "Extras visuales: OFF");
};

export const toggleLines = async (): Promise<void> => {
	const enabled = !current.enabled;
	updateLinesLive({ enabled });
	await window.electronAPI.setAppPreference("lines_enabled", enabled);
	toast(enabled ? "Lineas finas: ON" : "Lineas finas: OFF (originales)");
};

// Detecta la carga o reemplazo del iframe para parchear antes de que el juego dibuje.
export const startLinesWatcher = async (): Promise<void> => {
	try {
		current = readConfigFromPrefs(await window.electronAPI.getAppPreferences());
	} catch (error) {
		console.error("[haxlines] no se pudieron leer las preferencias", error);
	}

	(window as any).__haxToggleLines = toggleLines;
	(window as any).__haxToggleCos = toggleCosmetics;
	// Diagnostico: en la consola de DevTools escribi  __haxLinesDebug(true)
	(window as any).__haxLinesDebug = (on: boolean = true) => {
		updateLinesLive({ debug: on });
		console.log("[haxlines] debug", on ? "ON (entra a una sala y mira los logs)" : "OFF");
	};

	const bindGameFrame = (): void => {
		const frame = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement | undefined;
		if (!frame || frame === observedFrame) return;
		if (observedFrame) observedFrame.removeEventListener("load", pushToGame);
		observedFrame = frame;
		frame.addEventListener("load", pushToGame);
		pushToGame();
	};

	new MutationObserver((records) => {
		const frameAdded = records.some(({ addedNodes }) =>
			Array.from(addedNodes).some((node) =>
				node instanceof Element && (node.matches(".gameframe") || !!node.querySelector(".gameframe"))
			)
		);
		if (frameAdded) bindGameFrame();
	}).observe(document.body, {
		childList: true,
		subtree: true,
	});
	bindGameFrame();
};
