// bg.ts
// Reemplaza el pasto verde que rodea la interfaz (lista de salas y pantalla ESC de la sala)
// por un degradé con los colores del cliente. No conozco el CSS exacto del juego, asi que
// se detecta en vivo: elementos grandes cuyo fondo calculado es verde o una imagen
// (pasto). Se marcan con data-hx-bg y una regla CSS les pone el degradé.
// Lo de adentro de la sala (canvas) lo resuelve lines.ts.

import { BRAND_LOGO } from "./brand";
import { getLinesConfig } from "./lines";

// Escudo al 7% de opacidad como imagen de fondo (se genera una vez por escudo).
let crestSrc = "";
let crestUrl = "";
const prepareCrest = (src: string): void => {
	if (crestSrc === src) return;
	crestSrc = src;
	crestUrl = "";
	const img = new Image();
	img.onload = () => {
		try {
			const size = 512;
			const canvas = document.createElement("canvas");
			canvas.width = canvas.height = size;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			const k = Math.min(size / img.width, size / img.height);
			ctx.globalAlpha = 0.07;
			ctx.drawImage(img, (size - img.width * k) / 2, (size - img.height * k) / 2, img.width * k, img.height * k);
			if (crestSrc === src) crestUrl = canvas.toDataURL("image/png");
		} catch { /* imagen no disponible */ }
	};
	img.src = src;
};

const STYLE_ID = "hax-bg-style";
const ATTR = "data-hx-bg";

const isGreen = (css: string): boolean => {
	const m = css.match(/rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)(?:[ ,/]+([\d.]+))?/i);
	if (!m) return false;
	const [r, g, b] = [+m[1], +m[2], +m[3]];
	const a = m[4] === undefined ? 1 : +m[4];
	// verde / oliva (el pasto del juego es rgb(147,158,127)): el canal verde manda
	return a > 0.5 && g >= r && g > b + 15;
};

const hasImage = (css: string): boolean => /url\(/i.test(css);

const ensureStyle = (doc: Document, from: string, to: string, anim: boolean, crest: string): void => {
	let style = doc.getElementById(STYLE_ID) as HTMLStyleElement | null;
	if (!style) {
		style = doc.createElement("style");
		style.id = STYLE_ID;
		(doc.head || doc.documentElement).appendChild(style);
	}
	const layer = crest ? `url("${crest}") center / min(58vmin, 520px) no-repeat, ` : "";
	const sizes = crest ? "min(58vmin, 520px) min(58vmin, 520px), " : "";
	const css = anim
		? `[${ATTR}] { background: ${layer}linear-gradient(135deg, ${from}, ${to}, ${from}) !important; background-size: ${sizes}300% 300% !important; animation: hxbgmove 26s ease-in-out infinite; }
@keyframes hxbgmove { 0%, 100% { background-position: ${crest ? "center, " : ""}0% 50%; } 50% { background-position: ${crest ? "center, " : ""}100% 50%; } }`
		: `[${ATTR}] { background: ${layer}linear-gradient(160deg, ${from}, ${to}) !important; background-attachment: fixed !important; background-size: ${crest ? "min(58vmin, 520px) min(58vmin, 520px), cover" : "cover"} !important; }`;
	if (style.textContent !== css) style.textContent = css;
};

const clear = (doc: Document): void => {
	doc.querySelectorAll(`[${ATTR}]`).forEach((n) => n.removeAttribute(ATTR));
	doc.getElementById(STYLE_ID)?.remove();
};

const scan = (doc: Document): void => {
	const view = doc.defaultView;
	if (!view || !doc.body) return;
	const minW = view.innerWidth * 0.6;
	const minH = view.innerHeight * 0.6;
	const candidates: Element[] = [doc.documentElement, doc.body];
	// el contenedor de pantalla suele ser un hijo directo de body (o de ese)
	for (const child of Array.from(doc.body.children).slice(0, 12)) {
		candidates.push(child);
		for (const sub of Array.from(child.children).slice(0, 8)) candidates.push(sub);
	}
	for (const node of candidates) {
		if (!(node instanceof view.HTMLElement)) continue;
		if (node.id && node.id.startsWith("hax-")) continue;
		if (node.tagName === "CANVAS" || node.tagName === "IMG" || node.tagName === "IFRAME") continue;
		if (node.hasAttribute(ATTR)) continue;
		const rect = node.getBoundingClientRect();
		const isRoot = node === doc.documentElement || node === doc.body;
		if (!isRoot && (rect.width < minW || rect.height < minH)) continue;
		const cs = view.getComputedStyle(node);
		// html/body siempre se pintan si tienen imagen (el canvas del juego va encima);
		// en contenedores intermedios se evita tocar los que envuelven un canvas.
		if (isGreen(cs.backgroundColor) || (hasImage(cs.backgroundImage) && (isRoot || !node.querySelector("canvas")))) {
			node.setAttribute(ATTR, "");
		}
	}
};

const apply = (doc: Document | null | undefined, on: boolean, from: string, to: string, anim: boolean, crest: string): void => {
	try {
		if (!doc?.body) return;
		if (!on) {
			if (doc.getElementById(STYLE_ID)) clear(doc);
			return;
		}
		ensureStyle(doc, from, to, anim, crest);
		scan(doc);
	} catch {
		/* iframe sin acceso */
	}
};

export const refreshBackground = (): void => {
	const cfg = getLinesConfig();
	prepareCrest(cfg.wmLogo || BRAND_LOGO);
	const crest = cfg.bgCrest ? crestUrl : "";
	apply(document, cfg.bgEnabled, cfg.bgFrom, cfg.bgTo, cfg.bgAnim, crest);
	try {
		const frame = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement | undefined;
		apply(frame?.contentDocument, cfg.bgEnabled, cfg.bgFrom, cfg.bgTo, cfg.bgAnim, crest);
	} catch {
		/* sin acceso */
	}
};

export const startBackgroundWatcher = (): void => {
	setInterval(refreshBackground, 800);
};
