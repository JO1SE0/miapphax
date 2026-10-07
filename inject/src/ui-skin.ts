// ui-skin.ts
// Rediseño "tarjetas" de la interfaz de HaxBall (lista de salas, sala del host,
// dialogos, chat). Es solo CSS: no cambia el HTML ni el comportamiento.
//
// Los selectores de la sala (.room-view > .container, .teams, .player-list-view,
// .settings, .controls ...) son los reales del juego. Los de la lista de salas y
// los dialogos son genericos (tabla, th, td, .dialog) porque no tengo su HTML
// exacto; la herramienta "Copiar estructura de la UI" del panel sirve para afinarlos.
//
// Usa las variables del tema (--hx-accent, --hx-accent-soft, --hx-radius) con
// valores de respaldo, asi funciona aunque el tema moderno este apagado.

export type CardStyle = "glass" | "solid" | "flat";

export type SkinOptions = {
	cardStyle: CardStyle;
	density: number; // 0.6 compacto ... 1 normal ... 1.6 amplio
	lowGpu: boolean; // sin blur (modo baja latencia)
};

const clamp = (n: number, min: number, max: number): number =>
	Math.min(max, Math.max(min, n));

export const buildSkinCss = (o: SkinOptions): string => {
	const d = clamp(Number.isFinite(o.density) ? o.density : 1, 0.5, 1.8);
	const style: CardStyle = ["glass", "solid", "flat"].includes(o.cardStyle) ? o.cardStyle : "glass";
	const blur = o.lowGpu || style !== "glass" ? 0 : 14;

	const cardBg =
		style === "glass" ? "rgba(13, 24, 46, 0.82)" : style === "solid" ? "#0e1a31" : "rgba(255, 255, 255, 0.03)";
	const border = style === "flat" ? "transparent" : "rgba(208, 184, 120, 0.18)";
	const shadow = style === "flat" ? "none" : "0 12px 40px rgba(0, 0, 0, 0.45)";
	const inner = style === "solid" ? "#0a1426" : "rgba(208, 184, 120, 0.05)";

	return `
:root {
	--hx-card-bg: ${cardBg};
	--hx-card-border: ${border};
	--hx-card-shadow: ${shadow};
	--hx-blur: ${blur}px;
	--hx-inner: ${inner};
	--hx-d: ${d};
	--hx-font: Inter, "Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, Roboto, sans-serif;
	--hx-font-display: Outfit, Inter, "Segoe UI", system-ui, sans-serif;
	--hx-gold: #d0b878;
	--hx-navy: #203860;
	--hx-navy-deep: #08101f;
}
body { font-family: var(--hx-font) !important; }
${o.lowGpu ? "* { transition: none !important; animation: none !important; }" : ""}
button, input, select, textarea { font-family: inherit; }

/* ---------- Tarjetas generales (dialogos, menus) ---------- */
.dialog {
	background: var(--hx-card-bg);
	border: 1px solid var(--hx-card-border);
	border-radius: calc(var(--hx-radius, 8px) + 6px);
	box-shadow: var(--hx-card-shadow);
	-webkit-backdrop-filter: blur(var(--hx-blur));
	backdrop-filter: blur(var(--hx-blur));
}
.dialog h1, h1, h2 { font-family: var(--hx-font-display) !important; font-weight: 700; letter-spacing: 0.01em; }
.dialog h1 { font-size: 20px; color: var(--hx-gold); }
.dialog hr { border: none; border-top: 1px solid var(--hx-card-border); }

/* ---------- Sala del host (lobby) ---------- */
.room-view > .container {
	background: var(--hx-card-bg);
	border: 1px solid var(--hx-card-border);
	border-radius: calc(var(--hx-radius, 8px) + 8px);
	box-shadow: var(--hx-card-shadow);
	-webkit-backdrop-filter: blur(var(--hx-blur));
	backdrop-filter: blur(var(--hx-blur));
	padding: calc(14px * var(--hx-d)) calc(16px * var(--hx-d)) 30px;
}
.room-view > .container > h1 {
	font-size: 22px;
	font-weight: 700;
	letter-spacing: -0.01em;
	border-bottom: 2px solid transparent;
	border-image: linear-gradient(90deg, var(--hx-accent, #3b82f6), var(--hx-accent2, var(--hx-accent, #3b82f6)) 60%, transparent) 1;
	padding-bottom: 12px;
}
.room-view > .container > h1::before {
	content: "";
	display: inline-block;
	width: 9px;
	height: 9px;
	margin-right: 10px;
	border-radius: 50%;
	vertical-align: middle;
	background: var(--hx-accent2, var(--hx-accent, #3b82f6));
	box-shadow: 0 0 10px var(--hx-accent2, var(--hx-accent, #3b82f6));
}
.room-view .header-btns button,
.room-view .teams .tools button {
	background: var(--hx-inner) !important;
	border: 1px solid var(--hx-card-border) !important;
}
.room-view .header-btns button:hover,
.room-view .teams .tools button:hover {
	background: var(--hx-accent-soft, rgba(59, 130, 246, 0.3)) !important;
}

/* equipos como tarjetas */
.room-view .teams .player-list-view {
	background: var(--hx-inner);
	border: 1px solid var(--hx-card-border);
	border-radius: calc(var(--hx-radius, 8px) + 4px);
	padding: 8px;
	box-sizing: border-box;
	overflow: hidden;
}
.room-view .teams .player-list-view.t-red { box-shadow: inset 0 3px 0 #e56e56; }
.room-view .teams .player-list-view.t-blue { box-shadow: inset 0 3px 0 #5689e5; }
.room-view .teams .player-list-view .list {
	background: rgba(0, 0, 0, 0.18) !important;
	border-radius: var(--hx-radius, 8px);
}
.player-list-item {
	border-radius: var(--hx-radius, 8px);
	padding-top: calc(3px * var(--hx-d)) !important;
	padding-bottom: calc(3px * var(--hx-d)) !important;
	transition: background-color 0.12s ease;
}
.player-list-item:hover { background: var(--hx-accent-soft, rgba(59, 130, 246, 0.3)) !important; }
.player-list-item .p-ping { opacity: 0.65; font-variant-numeric: tabular-nums; }

/* opciones de la partida (tiempo, goles, mapa) */
.room-view .settings {
	background: var(--hx-inner);
	border: 1px solid var(--hx-card-border);
	border-radius: calc(var(--hx-radius, 8px) + 2px);
	padding: 6px 14px;
	box-sizing: border-box;
}
.room-view .settings > div { padding-top: calc(4px * var(--hx-d)); padding-bottom: calc(4px * var(--hx-d)); }
.room-view .settings .lbl { color: #b9c3d6; }
.room-view .settings select { border: 1px solid var(--hx-card-border); background: rgba(0, 0, 0, 0.25); }

/* botones de control del host */
.room-view .controls button {
	border-radius: calc(var(--hx-radius, 8px) + 2px) !important;
	font-weight: 700;
	letter-spacing: 0.01em;
}
.room-view .controls button.green { background: linear-gradient(180deg, #e2c987, #c2a35e) !important; color: #14213a !important; }
.room-view .controls button.red { background: linear-gradient(180deg, #d0252d, #a8121a) !important; }
.room-view .controls button.green:hover { filter: brightness(1.1); }
.room-view .controls button.red:hover { filter: brightness(1.1); }

/* ---------- Lista de salas ---------- */
.roomlist-view table { border-collapse: separate; border-spacing: 0 calc(3px * var(--hx-d)); }
.roomlist-view thead th {
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: #8b94a3;
}
.roomlist-view tbody tr { transition: background-color 0.12s ease; }
.roomlist-view tbody tr td {
	padding-top: calc(5px * var(--hx-d));
	padding-bottom: calc(5px * var(--hx-d));
}
.roomlist-view tbody tr td:first-child { border-radius: var(--hx-radius, 8px) 0 0 var(--hx-radius, 8px); }
.roomlist-view tbody tr td:last-child { border-radius: 0 var(--hx-radius, 8px) var(--hx-radius, 8px) 0; }
.roomlist-view tbody tr:hover td,
.roomlist-view tbody tr.selected td { background: var(--hx-accent-soft, rgba(59, 130, 246, 0.3)) !important; }
.roomlist-view tbody tr:hover td:first-child,
.roomlist-view tbody tr.selected td:first-child { box-shadow: inset 3px 0 0 var(--hx-accent2, var(--hx-accent, #3b82f6)); }
.roomlist-view input[type=checkbox] { accent-color: var(--hx-accent, #3b82f6); }

/* ---------- Elegir nombre / ajustes ---------- */
.choose-nickname-view .dialog input[type=text] { padding: 8px 12px; font-size: 15px; }
.settings-view button.selected { background: var(--hx-accent, #3b82f6) !important; }

/* ---------- Dentro de la partida ---------- */
.chatbox-view-contents > .input input[type=text] {
	border-radius: 999px !important;
	padding-left: 14px !important;
	border: 1px solid var(--hx-card-border) !important;
}

/* ---------- Cabecera del cliente (marca TL App) ---------- */
.header.tl-header {
	background: linear-gradient(180deg, #17294a 0%, #0c1830 100%) !important;
	border-bottom: 1px solid rgba(208, 184, 120, 0.35);
	box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
	padding: 0 14px;
	box-sizing: border-box;
}
.header.tl-header::after {
	content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 1px; pointer-events: none;
	background: linear-gradient(90deg, transparent, var(--hx-gold), transparent); opacity: 0.8;
}
.header.tl-header .title, .header.tl-header .title a { text-decoration: none !important; background: none !important; }
.tl-crest { height: 28px; width: 28px; object-fit: contain; vertical-align: middle; margin-right: 10px; filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.5)); }
.tl-wordmark {
	font-family: var(--hx-font-display) !important; font-weight: 800; font-size: 19px; letter-spacing: 0.14em; text-transform: uppercase;
	vertical-align: middle;
	background: linear-gradient(180deg, #ffffff 10%, var(--hx-gold) 100%); -webkit-background-clip: text; background-clip: text; color: transparent !important;
}
.header.tl-header a { color: #dfe6f3; }
.address-bar-input { border-radius: 999px !important; padding: 4px 14px !important; font-family: var(--hx-font) !important; font-size: 14px !important; }

/* ---------- Detalles generales ---------- */
::selection { background: rgba(208, 184, 120, 0.35); color: #fff; }
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: rgba(8, 16, 31, 0.6); }
::-webkit-scrollbar-thumb { background: rgba(208, 184, 120, 0.35); border-radius: 8px; border: 2px solid transparent; background-clip: padding-box; }
::-webkit-scrollbar-thumb:hover { background: rgba(208, 184, 120, 0.6); background-clip: padding-box; border: 2px solid transparent; }
.dialog button, .roomlist-view button, .choose-nickname-view button, .settings-view button {
	font-family: var(--hx-font); font-weight: 600; letter-spacing: 0.01em;
	border: 1px solid rgba(208, 184, 120, 0.22) !important;
}
.dialog button:hover, .roomlist-view button:hover, .choose-nickname-view button:hover, .settings-view button:hover {
	border-color: rgba(208, 184, 120, 0.6) !important; box-shadow: 0 0 14px rgba(208, 184, 120, 0.15);
}
.dialog input[type=text], .dialog select, .roomlist-view input[type=text], .roomlist-view select {
	background: rgba(8, 16, 31, 0.55) !important; border: 1px solid rgba(208, 184, 120, 0.22) !important; color: #eef2fa;
}
`;
};
