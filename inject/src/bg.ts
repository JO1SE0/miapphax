// bg.ts
// Reemplaza el pasto verde que rodea la interfaz (lista de salas y pantalla ESC de la sala)
// por un degradé con los colores del cliente. No conozco el CSS exacto del juego, asi que
// se detecta en vivo: elementos grandes cuyo fondo calculado es verde o una imagen
// (pasto). Se marcan con data-hx-bg y una regla CSS les pone el degradé.
// Lo de adentro de la sala (canvas) lo resuelve lines.ts.

import { getLinesConfig } from "./lines";

const STYLE_ID = "hax-bg-style";
const ATTR = "data-hx-bg";

const isGreen = (css: string): boolean => {
	const m = css.match(/rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)(?:[ ,/]+([\d.]+))?/i);
	if (!m) return false;
	const [r, g, b] = [+m[1], +m[2], +m[3]];
	const a = m[4] === undefined ? 1 : +m[4];
	return a > 0.5 && g > r + 12 && g > b + 12;
};

const hasImage = (css: string): boolean => /url\(/i.test(css);

const ensureStyle = (doc: Document, from: string, to: string, anim: boolean): void => {
	let style = doc.getElementById(STYLE_ID) as HTMLStyleElement | null;
	if (!style) {
		style = doc.createElement("style");
		style.id = STYLE_ID;
		(doc.head || doc.documentElement).appendChild(style);
	}
	const css = anim
		? `[${ATTR}] { background: linear-gradient(135deg, ${from}, ${to}, ${from}) !important; background-size: 300% 300% !important; animation: hxbgmove 26s ease-in-out infinite; }
@keyframes hxbgmove { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }`
		: `[${ATTR}] { background: linear-gradient(160deg, ${from}, ${to}) fixed !important; background-size: cover !important; }`;
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
		if (isGreen(cs.backgroundColor) || (hasImage(cs.backgroundImage) && !node.querySelector("canvas"))) {
			node.setAttribute(ATTR, "");
		}
	}
};

const apply = (doc: Document | null | undefined, on: boolean, from: string, to: string, anim: boolean): void => {
	try {
		if (!doc?.body) return;
		if (!on) {
			if (doc.getElementById(STYLE_ID)) clear(doc);
			return;
		}
		ensureStyle(doc, from, to, anim);
		scan(doc);
	} catch {
		/* iframe sin acceso */
	}
};

export const refreshBackground = (): void => {
	const cfg = getLinesConfig();
	apply(document, cfg.bgEnabled, cfg.bgFrom, cfg.bgTo, cfg.bgAnim);
	try {
		const frame = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement | undefined;
		apply(frame?.contentDocument, cfg.bgEnabled, cfg.bgFrom, cfg.bgTo, cfg.bgAnim);
	} catch {
		/* sin acceso */
	}
};

export const startBackgroundWatcher = (): void => {
	setInterval(refreshBackground, 800);
};
