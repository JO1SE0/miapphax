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
		style === "glass" ? "rgba(17, 21, 28, 0.80)" : style === "solid" ? "#12161d" : "rgba(255, 255, 255, 0.03)";
	const border = style === "flat" ? "transparent" : "rgba(255, 255, 255, 0.08)";
	const shadow = style === "flat" ? "none" : "0 12px 40px rgba(0, 0, 0, 0.45)";
	const inner = style === "solid" ? "#0e1218" : "rgba(255, 255, 255, 0.04)";

	return `
:root {
	--hx-card-bg: ${cardBg};
	--hx-card-border: ${border};
	--hx-card-shadow: ${shadow};
	--hx-blur: ${blur}px;
	--hx-inner: ${inner};
	--hx-d: ${d};
	--hx-font: "Segoe UI Variable Text", "Segoe UI", Inter, system-ui, -apple-system, Roboto, sans-serif;
}
body { font-family: var(--hx-font) !important; }
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
.dialog h1 { font-size: 20px; font-weight: 700; letter-spacing: -0.01em; }
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
	border-bottom: 1px solid var(--hx-card-border);
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
	background: var(--hx-accent, #3b82f6);
	box-shadow: 0 0 10px var(--hx-accent, #3b82f6);
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
.room-view .settings .lbl { color: #aab2c0; }
.room-view .settings select { border: 1px solid var(--hx-card-border); background: rgba(0, 0, 0, 0.25); }

/* botones de control del host */
.room-view .controls button {
	border-radius: calc(var(--hx-radius, 8px) + 2px) !important;
	font-weight: 700;
	letter-spacing: 0.01em;
}
.room-view .controls button.green { background: linear-gradient(180deg, #3fbf6b, #2a9d55) !important; }
.room-view .controls button.red { background: linear-gradient(180deg, #e0574f, #c43d36) !important; }
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

/* ---------- Cabecera del cliente ---------- */
.address-bar-input { border-radius: 999px !important; padding-left: 14px !important; }
`;
};
