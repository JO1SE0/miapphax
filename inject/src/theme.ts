// theme.ts
// Tema moderno con color de acento elegible.
//
// Como funciona (sin conocer los selectores de la pagina):
//  1. Recorre las hojas de estilo (CSSOM) de la pagina y del iframe del juego.
//  2. Cada color que sea un "azul acero oscuro" (el de los botones originales)
//     se reemplaza por el acento elegido, y los fondos oscuros azulados se
//     tintan levemente con el mismo tono. Rojos, el azul de equipo, blancos y
//     negros NO se tocan.
//  3. Se inyecta una capa extra (bordes redondeados, foco, scrollbars) que usa
//     variables CSS (--hx-accent...).
// Los valores originales se guardan, asi que apagar el tema los restaura.

export type Hsl = { h: number; s: number; l: number };

export type ThemeConfig = {
	enabled: boolean;
	accent: string;
	glow: string; // color del brillo de fondo ("" = el mismo que el acento)
	glowStrength: number; // 0 = sin brillo, 1 = muy fuerte
	radius: number; // radio de esquinas en px
};

export const DEFAULT_THEME: ThemeConfig = {
	enabled: true,
	accent: "#3b82f6",
	glow: "",
	glowStrength: 0.35,
	radius: 8,
};

export const PRESETS: { name: string; hex: string }[] = [
	{ name: "Blue", hex: "#3b82f6" },
	{ name: "Violet", hex: "#8b5cf6" },
	{ name: "Pink", hex: "#ec4899" },
	{ name: "Red", hex: "#ef4444" },
	{ name: "Orange", hex: "#f97316" },
	{ name: "Green", hex: "#22c55e" },
	{ name: "Cyan", hex: "#06b6d4" },
];

// ---------------------------------------------------------------------------
// Utilidades de color
// ---------------------------------------------------------------------------

const clamp = (n: number, min: number, max: number): number =>
	Math.min(max, Math.max(min, n));

export const isValidHex = (value: string): boolean =>
	/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);

export const hexToRgb = (hex: string): [number, number, number] => {
	let h = hex.replace("#", "");
	if (h.length === 3 || h.length === 4) {
		h = h.split("").map((c) => c + c).join("");
	}
	const n = parseInt(h.slice(0, 6), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const rgbToHsl = (r: number, g: number, b: number): Hsl => {
	r /= 255; g /= 255; b /= 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	const d = max - min;
	if (d === 0) return { h: 0, s: 0, l };
	const s = d / (1 - Math.abs(2 * l - 1));
	let h: number;
	if (max === r) h = ((g - b) / d) % 6;
	else if (max === g) h = (b - r) / d + 2;
	else h = (r - g) / d + 4;
	h *= 60;
	if (h < 0) h += 360;
	return { h, s, l };
};

export const hslToRgb = ({ h, s, l }: Hsl): [number, number, number] => {
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;
	let r = 0, g = 0, b = 0;
	if (h < 60) [r, g, b] = [c, x, 0];
	else if (h < 120) [r, g, b] = [x, c, 0];
	else if (h < 180) [r, g, b] = [0, c, x];
	else if (h < 240) [r, g, b] = [0, x, c];
	else if (h < 300) [r, g, b] = [x, 0, c];
	else [r, g, b] = [c, 0, x];
	return [
		Math.round((r + m) * 255),
		Math.round((g + m) * 255),
		Math.round((b + m) * 255),
	];
};

// tope de saturacion para que los colores muy puros no queden agresivos
const MAX_SAT = 0.72;

const toHex = ([r, g, b]: [number, number, number]): string =>
	"#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");

// ---------------------------------------------------------------------------
// Mapeo de colores
// ---------------------------------------------------------------------------

// Devuelve el color nuevo (en rgb) o null si ese color no se debe tocar.
export const mapRgb = (
	r: number,
	g: number,
	b: number,
	accent: Hsl
): [number, number, number] | null => {
	const { h, s, l } = rgbToHsl(r, g, b);

	// A) azul acero oscuro (botones, hover, barras...)  -> acento
	//    #244967 = hsl(207, 48%, 28%) ; #3b5d82 = hsl(210, 37%, 36%)
	if (h >= 190 && h <= 240 && s >= 0.2 && s <= 0.62 && l >= 0.14 && l <= 0.48) {
		const base = Math.min(accent.l, 0.48);
		return hslToRgb({
			h: accent.h,
			s: Math.min(accent.s, MAX_SAT),
			l: clamp(base + (l - 0.28), 0.12, 0.8),
		});
	}

	// B) fondos oscuros azulados (#1b2125, #111619...) -> mismo brillo, tinte del acento
	if (h >= 180 && h <= 240 && s >= 0.06 && s <= 0.45 && l < 0.24) {
		return hslToRgb({ h: accent.h, s: Math.min(s, 0.2), l });
	}

	return null;
};

const HEX_RE = /(?<!url\(["']?)#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g;
const RGB_RE = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)/g;

// Reemplaza todos los colores que correspondan dentro de un texto CSS / valor.
export const mapCssText = (text: string, accent: Hsl): string => {
	if (!text || (text.indexOf("#") === -1 && text.indexOf("rgb") === -1)) return text;

	let out = text.replace(RGB_RE, (whole, r, g, b, a) => {
		const mapped = mapRgb(+r, +g, +b, accent);
		if (!mapped) return whole;
		return a !== undefined
			? `rgba(${mapped[0]}, ${mapped[1]}, ${mapped[2]}, ${a})`
			: `rgb(${mapped[0]}, ${mapped[1]}, ${mapped[2]})`;
	});

	out = out.replace(HEX_RE, (whole) => {
		let hex = whole.slice(1);
		let alpha = "";
		if (hex.length === 4) { alpha = hex[3] + hex[3]; hex = hex.slice(0, 3); }
		if (hex.length === 8) { alpha = hex.slice(6); hex = hex.slice(0, 6); }
		const [r, g, b] = hexToRgb("#" + hex);
		const mapped = mapRgb(r, g, b, accent);
		return mapped ? toHex(mapped) + alpha : whole;
	});

	return out;
};

export const accentToHsl = (hex: string): Hsl => {
	const [r, g, b] = hexToRgb(isValidHex(hex) ? hex : DEFAULT_THEME.accent);
	return rgbToHsl(r, g, b);
};

// CSS de la capa moderna. `top` = pagina principal (lleva el brillo de fondo);
// el iframe del juego no lo lleva.
export const buildModernCss = (
	hex: string,
	opts: { radius?: number; glow?: string; glowStrength?: number } = {},
	top: boolean = false
): string => {
	const safe = isValidHex(hex) ? hex : DEFAULT_THEME.accent;
	const a = accentToHsl(safe);
	const base = Math.min(a.l, 0.55);
	const main = toHex(hslToRgb({ h: a.h, s: Math.min(a.s, MAX_SAT), l: base }));
	const hover = toHex(hslToRgb({ h: a.h, s: Math.min(a.s, MAX_SAT), l: clamp(base + 0.08, 0, 0.85) }));
	const [mr, mg, mb] = hexToRgb(main);
	const radius = clamp(Number.isFinite(opts.radius as number) ? (opts.radius as number) : DEFAULT_THEME.radius, 0, 24);

	const strength = clamp(Number.isFinite(opts.glowStrength as number) ? (opts.glowStrength as number) : DEFAULT_THEME.glowStrength, 0, 1);
	const [gr, gg, gb] = opts.glow && isValidHex(opts.glow) ? hexToRgb(opts.glow) : [mr, mg, mb];
	const glowCss = top && strength > 0 ? `
html::before {
	content: "";
	position: fixed;
	inset: 0;
	z-index: -1;
	pointer-events: none;
	background:
		radial-gradient(60% 55% at 10% 18%, rgba(${gr}, ${gg}, ${gb}, ${(strength * 0.55).toFixed(3)}) 0%, transparent 70%),
		radial-gradient(50% 50% at 92% 90%, rgba(${gr}, ${gg}, ${gb}, ${(strength * 0.4).toFixed(3)}) 0%, transparent 70%);
}` : "";

	return `
:root {
	--hx-accent: ${main};
	--hx-accent-hover: ${hover};
	--hx-accent-soft: rgba(${mr}, ${mg}, ${mb}, 0.35);
	--hx-radius: ${radius}px;
}
button {
	border-radius: var(--hx-radius) !important;
	transition: background-color .15s ease, transform .05s ease, box-shadow .15s ease;
}
button:active { transform: translateY(1px); }
button:focus-visible { outline: 2px solid var(--hx-accent) !important; outline-offset: 1px; }
input[type=text], input[type=password], input[type=search], input:not([type]), select, textarea {
	border-radius: var(--hx-radius) !important;
	transition: border-color .15s ease, box-shadow .15s ease;
}
input[type=text]:focus, input[type=password]:focus, input[type=search]:focus,
input:not([type]):focus, select:focus, textarea:focus {
	outline: none !important;
	border-color: var(--hx-accent) !important;
	box-shadow: 0 0 0 2px var(--hx-accent-soft) !important;
}
input[type=range] { accent-color: var(--hx-accent); }
.dialog, dialog { border-radius: calc(var(--hx-radius) + 4px); }
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,.16); border-radius: 8px; }
::-webkit-scrollbar-thumb:hover { background: var(--hx-accent); }
::selection { background: var(--hx-accent-soft); }
${glowCss}
`;
};

// ---------------------------------------------------------------------------
// Aplicacion al documento (CSSOM). Solo se usa en el navegador.
// ---------------------------------------------------------------------------

const MODERN_STYLE_ID = "hax-theme-modern";

// valores originales de cada declaracion, para poder restaurar / recalcular
const originals = new WeakMap<CSSStyleDeclaration, Map<string, [string, string]>>();
const processedSheets = new WeakSet<CSSStyleSheet>();
const appliedVersion = new WeakMap<Document, number>();

const walkRules = (rules: CSSRuleList, fn: (rule: CSSStyleRule) => void): void => {
	for (const rule of Array.from(rules)) {
		if ((rule as CSSStyleRule).style && rule.type === 1) fn(rule as CSSStyleRule);
		const inner = (rule as any).cssRules as CSSRuleList | undefined;
		if (inner) walkRules(inner, fn);
	}
};

const rewriteDeclaration = (style: CSSStyleDeclaration, accent: Hsl | null): void => {
	let saved = originals.get(style);
	if (!saved) {
		saved = new Map();
		for (let i = 0; i < style.length; i++) {
			const prop = style[i];
			saved.set(prop, [style.getPropertyValue(prop), style.getPropertyPriority(prop)]);
		}
		originals.set(style, saved);
	}
	saved.forEach(([value, priority], prop) => {
		if (!value) return;
		const next = accent ? mapCssText(value, accent) : value;
		if (style.getPropertyValue(prop) !== next) {
			style.setProperty(prop, next, priority);
		}
	});
};

const rewriteSheet = (sheet: CSSStyleSheet, accent: Hsl | null): void => {
	// no tocar las hojas propias del cliente (capa moderna, panel lateral)
	if (((sheet.ownerNode as HTMLElement | null)?.id || "").startsWith("hax-")) return;
	let rules: CSSRuleList;
	try {
		rules = sheet.cssRules; // lanza error si la hoja es de otro origen
	} catch {
		return;
	}
	walkRules(rules, (rule) => rewriteDeclaration(rule.style, accent));
};

let current: ThemeConfig = { ...DEFAULT_THEME };
let version = 1;

export const getThemeConfig = (): ThemeConfig => ({ ...current });

export const applyThemeToDocument = (doc: Document | null | undefined): void => {
	if (!doc || !doc.head) return;

	const accent = current.enabled ? accentToHsl(current.accent) : null;
	const versionChanged = appliedVersion.get(doc) !== version;

	// capa moderna (variables, bordes, foco, scrollbars)
	let modern = doc.getElementById(MODERN_STYLE_ID) as HTMLStyleElement | null;
	if (!current.enabled) {
		modern?.remove();
	} else if (versionChanged || !modern) {
		if (!modern) {
			modern = doc.createElement("style");
			modern.id = MODERN_STYLE_ID;
			doc.head.appendChild(modern);
		}
		modern.textContent = buildModernCss(
			current.accent,
			{ radius: current.radius, glow: current.glow, glowStrength: current.glowStrength },
			doc === document
		);
	}

	// recolorear las hojas: todas si cambio el tema, solo las nuevas si no
	for (const sheet of Array.from(doc.styleSheets)) {
		if (versionChanged || !processedSheets.has(sheet)) {
			rewriteSheet(sheet, accent);
			processedSheets.add(sheet);
		}
	}
	appliedVersion.set(doc, version);
};

const getGameDocument = (): Document | null => {
	const frame = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement | undefined;
	try {
		return frame?.contentDocument ?? null;
	} catch {
		return null;
	}
};

const applyEverywhere = (): void => {
	try { applyThemeToDocument(document); } catch (e) { console.error("[theme] pagina", e); }
	try { applyThemeToDocument(getGameDocument()); } catch (e) { console.error("[theme] juego", e); }
};

// Cambia el tema en vivo (los sliders / selector de color lo llaman).
export const updateThemeLive = (partial: Partial<ThemeConfig>): void => {
	current = { ...current, ...partial };
	version++;
	applyEverywhere();
};

// Color ya mapeado para los widgets del cliente que usan estilos inline
// (botones de Settings, etc.). Si el tema esta apagado devuelve el original.
export const themed = (color: string): string => {
	if (!current.enabled) return color;
	return mapCssText(color, accentToHsl(current.accent));
};

export const startThemeWatcher = async (): Promise<void> => {
	try {
		const prefs = await window.electronAPI.getAppPreferences();
		current = {
			enabled: prefs?.theme_enabled ?? DEFAULT_THEME.enabled,
			accent: isValidHex(prefs?.theme_accent) ? prefs.theme_accent : DEFAULT_THEME.accent,
			glow: isValidHex(prefs?.theme_glow) ? prefs.theme_glow : "",
			glowStrength: Number.isFinite(Number(prefs?.theme_glow_strength))
				? clamp(Number(prefs.theme_glow_strength), 0, 1)
				: DEFAULT_THEME.glowStrength,
			radius: Number.isFinite(Number(prefs?.theme_radius))
				? clamp(Number(prefs.theme_radius), 0, 24)
				: DEFAULT_THEME.radius,
		};
		// zoom de la interfaz (1 = 100%)
		window.electronAPI.setZoom?.(Number(prefs?.ui_zoom) || 1);
	} catch (error) {
		console.error("[theme] no se pudieron leer las preferencias", error);
	}
	version++;
	applyEverywhere();
	// el iframe del juego se recrea al entrar a cada sala y aparecen hojas nuevas
	setInterval(applyEverywhere, 1000);
};
