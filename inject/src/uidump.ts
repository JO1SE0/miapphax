// uidump.ts
// Herramienta de depuracion: arma un resumen (solo estructura) de lo que hay en
// pantalla -clases, data-hook y textos cortos- para poder ajustar los estilos a
// los selectores reales de HaxBall. No incluye contenido de chat ni datos tuyos:
// los textos se recortan y solo se leen de botones, titulos y etiquetas.

const MAX_LINES = 900;
const MAX_DEPTH = 9;
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "SVG", "PATH", "LINK", "META", "NOSCRIPT", "IMG", "CANVAS"]);
const TEXT_TAGS = new Set(["BUTTON", "H1", "H2", "H3", "LABEL", "TH", "OPTION", "A"]);

const describe = (node: Element): string => {
	let out = node.tagName.toLowerCase();
	if (node.id) out += `#${node.id}`;
	const cls = (node.getAttribute("class") || "").trim();
	if (cls) out += "." + cls.split(/\s+/).join(".");
	const hook = node.getAttribute("data-hook");
	if (hook) out += `[data-hook=${hook}]`;
	if (TEXT_TAGS.has(node.tagName)) {
		const text = (node.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24);
		if (text) out += ` "${text}"`;
	}
	return out;
};

const walk = (node: Element, depth: number, lines: string[]): void => {
	if (lines.length >= MAX_LINES || depth > MAX_DEPTH) return;
	if (SKIP_TAGS.has(node.tagName.toUpperCase())) return;
	const id = node.id || "";
	if (id.startsWith("hax-")) return; // el propio panel del cliente
	let line = "  ".repeat(depth) + describe(node);
	if (depth <= 3) {
		try {
			const cs = (node.ownerDocument.defaultView as Window).getComputedStyle(node);
			const img = cs.backgroundImage !== "none" ? ` img=${cs.backgroundImage.slice(0, 40)}` : "";
			const r = node.getBoundingClientRect();
			line += `  {bg ${cs.backgroundColor}${img} | ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)} pos=${cs.position} disp=${cs.display}}`; // ubica el pasto y las medidas
		} catch { /* sin acceso */ }
	}
	lines.push(line);
	for (const child of Array.from(node.children)) walk(child, depth + 1, lines);
};

export const dumpUiStructure = (): string => {
	const parts: string[] = [];

	const dump = (title: string, doc: Document | null | undefined) => {
		parts.push(`===== ${title} =====`);
		if (!doc?.body) {
			parts.push("(sin acceso)");
			return;
		}
		const lines: string[] = [];
		walk(doc.body, 0, lines);
		if (lines.length >= MAX_LINES) lines.push("... (recortado)");
		parts.push(...lines);
	};

	dump("PAGINA", document);
	try {
		const frame = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement | undefined;
		dump("IFRAME DEL JUEGO", frame?.contentDocument);
	} catch {
		parts.push("===== IFRAME DEL JUEGO =====", "(sin acceso)");
	}
	return parts.join("\n");
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		try {
			const area = document.createElement("textarea");
			area.value = text;
			area.style.cssText = "position:fixed;opacity:0;";
			document.body.appendChild(area);
			area.select();
			const ok = document.execCommand("copy");
			area.remove();
			return ok;
		} catch {
			return false;
		}
	}
};
