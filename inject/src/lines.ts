// lines.ts
// Grosor configurable de las lineas del juego (cancha, pelota/objetos, jugadores).
//
// Como funciona: HaxBall dibuja todo en un <canvas> dentro del iframe ".gameframe".
// Reemplazamos CanvasRenderingContext2D.prototype.stroke de ESE iframe por una
// version que, segun lo que se esta dibujando, usa el grosor que elegiste.
// Como se parchea el prototipo, funciona aunque el contexto ya exista.
//
// El juego fija el ancho antes de cada grupo de dibujo:
//   3 -> cancha, segmentos, joints, halo   (grupo "field")
//   2 -> discos                            (grupo "ball" o "players")
// Los jugadores se rellenan con un CanvasPattern, la pelota y demas discos
// con un color: asi se distinguen.

export type LinesConfig = {
	enabled: boolean;
	field: number;
	ball: number;
	players: number;
	debug: boolean;
};

// Valores originales del juego (tambien son los que se usan al apagar el modo).
export const ORIGINAL_WIDTHS = { field: 3, ball: 2, players: 2 };

// Anchos "crudos" que setea el juego antes de dibujar cada grupo.
const RAW_FIELD = 3;
const RAW_DISC = 2;

export const DEFAULT_CONFIG: LinesConfig = {
	enabled: true,
	field: 1.5,
	ball: 1,
	players: 1,
	debug: false,
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

// Instala el parche en la ventana (window) del iframe. Seguro de llamar varias veces.
export const installLinePatch = (win: any): boolean => {
	if (!win) return false;
	if (win[PATCH_FLAG]) return true;

	const proto = win.CanvasRenderingContext2D?.prototype;
	if (!proto || typeof proto.stroke !== "function") return false;

	const originalStroke = proto.stroke;
	const seen = new Set<string>();
	win[CONFIG_KEY] = { ...DEFAULT_CONFIG };

	proto.stroke = function (this: any, ...args: any[]) {
		const cfg: LinesConfig | undefined = win[CONFIG_KEY];
		if (!cfg || (!cfg.enabled && !cfg.debug)) {
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

const readConfigFromPrefs = (prefs: any): LinesConfig => ({
	enabled: prefs?.lines_enabled ?? DEFAULT_CONFIG.enabled,
	field: num(prefs?.line_width_field, DEFAULT_CONFIG.field),
	ball: num(prefs?.line_width_ball, DEFAULT_CONFIG.ball),
	players: num(prefs?.line_width_players, DEFAULT_CONFIG.players),
	debug: current.debug,
});

const getGameWindow = (): any => {
	const frame = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement | undefined;
	try {
		return frame?.contentWindow ?? null;
	} catch {
		return null;
	}
};

const pushToGame = (): void => {
	const win = getGameWindow();
	if (win && installLinePatch(win)) {
		writeConfig(win, current);
	}
};

export const getLinesConfig = (): LinesConfig => ({ ...current });

// Cambia valores en vivo (sin guardar). Lo usan los sliders mientras se arrastran.
export const updateLinesLive = (partial: Partial<LinesConfig>): void => {
	current = { ...current, ...partial };
	pushToGame();
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

export const toggleLines = async (): Promise<void> => {
	const enabled = !current.enabled;
	updateLinesLive({ enabled });
	await window.electronAPI.setAppPreference("lines_enabled", enabled);
	toast(enabled ? "Lineas finas: ON" : "Lineas finas: OFF (originales)");
};

// Lee las preferencias y revisa cada segundo si hay un iframe de juego nuevo
// para parchearlo (el iframe se recrea cada vez que entras a una sala).
export const startLinesWatcher = async (): Promise<void> => {
	try {
		current = readConfigFromPrefs(await window.electronAPI.getAppPreferences());
	} catch (error) {
		console.error("[haxlines] no se pudieron leer las preferencias", error);
	}

	(window as any).__haxToggleLines = toggleLines;
	// Diagnostico: en la consola de DevTools escribi  __haxLinesDebug(true)
	(window as any).__haxLinesDebug = (on: boolean = true) => {
		updateLinesLive({ debug: on });
		console.log("[haxlines] debug", on ? "ON (entra a una sala y mira los logs)" : "OFF");
	};

	pushToGame();
	setInterval(pushToGame, 1000);
};
