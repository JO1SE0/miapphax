// ui-skin.ts
// Rediseño visual estético y moderno de HaxBall (lista de salas, sala del host,
// diálogos, controles y menús con estilo gaming / esports glassmorphic).

export type CardStyle = "glass" | "solid" | "flat";

export type SkinOptions = {
	cardStyle: CardStyle;
	density: number; // 0.6 compacto ... 1 normal ... 1.6 amplio
	lowGpu: boolean; // modo FPS máximo: sin blur ni animaciones
	noBlur?: boolean; // solo sin desenfoque
	accent2?: string;
};

const clamp = (n: number, min: number, max: number): number =>
	Math.min(max, Math.max(min, n));

export const buildSkinCss = (o: SkinOptions): string => {
	const d = clamp(Number.isFinite(o.density) ? o.density : 1, 0.5, 1.8);
	const style: CardStyle = ["glass", "solid", "flat"].includes(o.cardStyle) ? o.cardStyle : "glass";
	const blur = o.lowGpu || o.noBlur || style !== "glass" ? 0 : 18;
	const accent2 = o.accent2 && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(o.accent2)
		? o.accent2
		: "#d0b878";

	const cardBg =
		style === "glass" ? "rgba(10, 19, 36, 0.86)" : style === "solid" ? "#0c162b" : "rgba(18, 30, 52, 0.75)";
	const border = style === "flat" ? "transparent" : "rgba(208, 184, 120, 0.28)";
	const shadow = style === "flat" ? "none" : "0 18px 50px rgba(0, 0, 0, 0.65), 0 0 25px rgba(208, 184, 120, 0.12)";
	const inner = style === "solid" ? "#07101e" : "rgba(208, 184, 120, 0.05)";

	return `
:root {
	--hx-card-bg: ${cardBg};
	--hx-card-border: ${border};
	--hx-card-shadow: ${shadow};
	--hx-blur: ${blur}px;
	--hx-inner: ${inner};
	--hx-d: ${d};
	--hx-font: "Plus Jakarta Sans", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	--hx-font-display: Outfit, "Plus Jakarta Sans", Inter, "Segoe UI", sans-serif;
	--hx-gold: ${accent2};
	--hx-gold-hover: #e5cb87;
	--hx-navy: #1b3258;
	--hx-navy-deep: #070e1c;
	--hx-red: #ef4444;
	--hx-blue: #3b82f6;
}

/* ---------- Fondo general y tipografía global ---------- */
html, body {
	font-family: var(--hx-font) !important;
	background: radial-gradient(circle at 50% 8%, #14233e 0%, #060b16 100%) !important;
	color: #e6edf3 !important;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}

/* Fondo del escudo: azul oscuro, siempre. html lleva el color base y body::before el degradé. */
html { background: #08101f !important; min-height: 100%; }
body { background-color: transparent !important; }
body::before {
	content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none;
	background:
		radial-gradient(ellipse 70% 55% at 18% 0%, rgba(45, 79, 138, 0.55) 0%, transparent 70%),
		radial-gradient(ellipse 60% 50% at 100% 100%, rgba(208, 184, 120, 0.14) 0%, transparent 65%),
		linear-gradient(165deg, #172c52 0%, #0b172c 55%, #060c19 100%);
}

${o.lowGpu ? `*, *::before, *::after {
	transition: none !important;
	animation: none !important;
	box-shadow: none !important;
	text-shadow: none !important;
	backdrop-filter: none !important;
	filter: none !important;
}
html, body {
	background: #08101f !important;
}
body::before { display: none !important; }` : ""}
button, input, select, textarea {
	font-family: var(--hx-font) !important;
}

/* ---------- Diálogos y Modales generales ---------- */
.dialog, dialog {
	background: var(--hx-card-bg) !important;
	border: 1px solid var(--hx-card-border) !important;
	border-radius: calc(var(--hx-radius) + 4px) !important;
	box-shadow: var(--hx-card-shadow) !important;
	padding: calc(16px * var(--hx-d)) calc(18px * var(--hx-d)) !important;
	max-width: min(680px, calc(100vw - 40px)) !important;
	height: fit-content !important;
	min-height: 0 !important;
	max-height: calc(100vh - 48px) !important;
	overflow: auto !important;
	flex: 0 1 auto !important;
}

.dialog h1, h1, h2 {
	font-family: var(--hx-font-display) !important;
	font-weight: 800 !important;
	letter-spacing: 0.02em !important;
}

.dialog h1 {
	font-size: 22px !important;
	color: #ffffff !important;
	background: linear-gradient(135deg, #ffffff 40%, var(--hx-gold) 100%) !important;
	-webkit-background-clip: text !important;
	background-clip: text !important;
	-webkit-text-fill-color: transparent !important;
	margin-bottom: 16px !important;
}

/* Settings debe ajustarse a sus controles, no heredar una altura de pantalla completa. */
.settings-view {
	width: min(420px, calc(100vw - 32px)) !important;
	height: fit-content !important;
	min-height: 0 !important;
	max-height: calc(100vh - 32px) !important;
	box-sizing: border-box !important;
	overflow: auto !important;
	flex: 0 1 auto !important;
}

.dialog.settings-view {
	width: min(360px, calc(100vw - 32px)) !important;
}

.dialog.settings-view .section,
.dialog.settings-view .section.selected {
	height: auto !important;
	min-height: 0 !important;
	flex: 0 0 auto !important;
}

.dialog hr {
	border: none !important;
	border-top: 1px solid var(--hx-card-border) !important;
	margin: 16px 0 !important;
}

/* ---------- Botones Generales Estilo Esports ---------- */
button, .btn {
	border-radius: var(--hx-radius) !important;
	font-weight: 700 !important;
	letter-spacing: 0.01em !important;
	font-size: 12px !important;
	padding: calc(6px * var(--hx-d)) calc(12px * var(--hx-d)) !important;
	background: linear-gradient(180deg, #182b4a 0%, #0e1b30 100%) !important;
	color: #e6edf3 !important;
	border: 1px solid rgba(208, 184, 120, 0.3) !important;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35) !important;
	cursor: pointer !important;
	transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.18s ease, transform 0.15s ease !important;
	display: inline-flex !important;
	align-items: center !important;
	justify-content: center !important;
	gap: 6px !important;
}

button:hover {
	background: linear-gradient(180deg, #223c68 0%, #142745 100%) !important;
	border-color: var(--hx-gold) !important;
	color: #ffffff !important;
	box-shadow: 0 6px 18px rgba(208, 184, 120, 0.25) !important;
	transform: translateY(-1px) !important;
}

button:active {
	transform: translateY(1px) !important;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4) !important;
}

@media (prefers-reduced-motion: reduce) {
	button, input[type=text], input[type=password], input[type=search], select, textarea {
		transition: none !important;
	}
	button:hover, button:active {
		transform: none !important;
	}
}

/* ---------- Inputs y Selects Estilizados ---------- */
input[type=text], input[type=password], input[type=search], select, textarea {
	background: rgba(11, 20, 36, 0.8) !important;
	border: 1px solid rgba(208, 184, 120, 0.3) !important;
	border-radius: 10px !important;
	color: #ffffff !important;
	padding: 8px 14px !important;
	font-size: 14px !important;
	outline: none !important;
	transition: all 0.2s ease !important;
	box-sizing: border-box !important;
}

input[type=text]:focus, input[type=password]:focus, input[type=search]:focus, select:focus, textarea:focus {
	border-color: var(--hx-gold) !important;
	box-shadow: 0 0 12px rgba(208, 184, 120, 0.35) !important;
	background: rgba(14, 25, 46, 0.95) !important;
}

select {
	cursor: pointer !important;
}

/* ---------- Lista de Salas: filas una debajo de otra, cada sala como tarjeta ----------
   .roomlist-view > .dialog > [h1, p, p, buscador, .splitter > (.list + .buttons)]
   .list > table.header + .separator + .content > table > tbody[data-hook=list] > tr (nombre, jugadores, clave, distancia). */
.roomlist-view .dialog {
	width: min(960px, calc(100vw - 40px)) !important;
	max-width: none !important;
	box-sizing: border-box !important;
}
.roomlist-view .dialog > h1 { position: relative; padding-bottom: 12px !important; margin-bottom: 10px !important; }
.roomlist-view .dialog > h1::after {
	content: ""; position: absolute; left: 0; bottom: 0; width: 100%; height: 3px; border-radius: 3px;
	background: linear-gradient(90deg, var(--hx-gold) 0%, rgba(208, 184, 120, 0.15) 60%, transparent 100%);
}
.roomlist-view .dialog > p { margin: 0 0 4px !important; font-size: 12px !important; line-height: 1.45 !important; color: #8fa2bf !important; }

/* buscador + selector de pais */
#searchRoom { height: 36px !important; border-radius: 999px !important; padding: 0 14px !important; box-sizing: border-box !important; }
#searchRoomByCountry { position: relative !important; border-radius: 999px !important; }
#searchRoomByCountry #dropdown-content {
	position: absolute !important; top: calc(100% + 6px) !important; right: 0 !important; left: auto !important; z-index: 80 !important;
	min-width: 170px; max-height: 320px; overflow-y: auto; padding: 6px !important; box-sizing: border-box;
	background: #0d1a31 !important; border: 1px solid rgba(208, 184, 120, 0.4) !important; border-radius: 14px !important;
	box-shadow: 0 18px 40px rgba(0, 0, 0, 0.6) !important; text-align: left;
}
#searchRoomByCountry #dropdown-content ul { list-style: none !important; margin: 0 !important; padding: 0 !important; }
#searchRoomByCountry #dropdown-content li { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 8px; cursor: pointer; }
#searchRoomByCountry #dropdown-content li:hover { background: var(--hx-accent-soft, rgba(45, 79, 138, 0.5)); }
#searchRoomByCountry #dropdown-content a { color: #eef2fa !important; text-transform: uppercase; font-size: 12px; font-weight: 700; }

.roomlist-view .splitter { gap: 16px; }

/* tablas: filas separadas (cada una es una tarjeta) */
.roomlist-view .list table {
	border-collapse: separate !important;
	border-spacing: 0 calc(8px * var(--hx-d)) !important;
	width: 100% !important;
}
.roomlist-view .list table.header thead td {
	font-family: var(--hx-font-display) !important;
	font-size: 11px !important;
	font-weight: 800 !important;
	letter-spacing: 0.12em !important;
	text-transform: uppercase !important;
	color: rgba(208, 184, 120, 0.85) !important;
	padding: 6px 16px !important;
	border: none !important;
	background: none !important;
}
.roomlist-view .list .separator { display: none !important; }

.roomlist-view .list .content tbody tr { cursor: pointer !important; background: none !important; border: none !important; }
.roomlist-view .list .content tbody tr td {
	padding: calc(13px * var(--hx-d)) 16px !important;
	border: none !important;
	border-top: 1px solid rgba(208, 184, 120, 0.14) !important;
	border-bottom: 1px solid rgba(208, 184, 120, 0.14) !important;
	background: linear-gradient(180deg, rgba(30, 55, 96, 0.55) 0%, rgba(13, 24, 44, 0.8) 100%) !important;
	font-size: 14px !important;
	color: #dbe5f5 !important;
	transition: background 0.15s ease, border-color 0.15s ease !important;
}
.roomlist-view .list .content tbody tr td:first-child {
	border-left: 1px solid rgba(208, 184, 120, 0.14) !important;
	border-radius: 16px 0 0 16px !important;
	box-shadow: inset 4px 0 0 rgba(208, 184, 120, 0.35);
	padding-left: 18px !important;
	font-weight: 700 !important;
	font-size: 15px !important;
	color: #ffffff !important;
}
.roomlist-view .list .content tbody tr td:last-child {
	border-right: 1px solid rgba(208, 184, 120, 0.14) !important;
	border-radius: 0 16px 16px 0 !important;
}
/* jugadores y clave: centrados, jugadores en dorado */
.roomlist-view .list .content tbody tr td:nth-child(2) { color: var(--hx-gold) !important; font-weight: 800 !important; font-variant-numeric: tabular-nums; }
.roomlist-view .list .content tbody tr td:nth-child(3) { color: #8fa2bf !important; font-size: 12px !important; text-transform: uppercase; letter-spacing: 0.05em; }
.roomlist-view .list .content tbody tr td:nth-child(4) { color: #a9bcd8 !important; font-size: 13px !important; }

.roomlist-view .list .content tbody tr:hover td {
	background: linear-gradient(180deg, rgba(44, 76, 128, 0.75) 0%, rgba(18, 32, 58, 0.9) 100%) !important;
	border-top-color: rgba(208, 184, 120, 0.5) !important;
	border-bottom-color: rgba(208, 184, 120, 0.5) !important;
}
.roomlist-view .list .content tbody tr:hover td:first-child { border-left-color: rgba(208, 184, 120, 0.5) !important; box-shadow: inset 4px 0 0 var(--hx-gold); }
.roomlist-view .list .content tbody tr:hover td:last-child { border-right-color: rgba(208, 184, 120, 0.5) !important; }

.roomlist-view .list .content tbody tr.selected td {
	background: linear-gradient(180deg, rgba(58, 98, 164, 0.85) 0%, rgba(22, 40, 72, 0.95) 100%) !important;
	border-top-color: var(--hx-gold) !important;
	border-bottom-color: var(--hx-gold) !important;
}
.roomlist-view .list .content tbody tr.selected td:first-child { border-left-color: var(--hx-gold) !important; box-shadow: inset 5px 0 0 var(--hx-gold), -4px 0 18px rgba(208, 184, 120, 0.18); }
.roomlist-view .list .content tbody tr.selected td:last-child { border-right-color: var(--hx-gold) !important; }

.roomlist-view input[type=checkbox] {
	accent-color: var(--hx-gold) !important;
	cursor: pointer !important;
	width: 15px;
	height: 15px;
}

/* ---------- Sala del Host (Lobby / Room View) ---------- */
.room-view > .container {
	position: fixed !important;
	left: 50% !important;
	top: 50% !important;
	transform: translate(-50%, -50%) !important;
	background: var(--hx-card-bg) !important;
	border: 1px solid var(--hx-card-border) !important;
	border-radius: 16px !important;
	box-shadow: var(--hx-card-shadow) !important;
	padding: calc(12px * var(--hx-d)) calc(14px * var(--hx-d)) calc(14px * var(--hx-d)) !important;
	width: min(760px, calc(100vw - 32px)) !important;
	max-width: 760px !important;
	height: fit-content !important;
	min-height: 0 !important;
	max-height: calc(100vh - 40px) !important;
	overflow: auto !important;
	box-sizing: border-box !important;
	margin: 0 !important;
}

.room-view > .container > h1 {
	font-family: var(--hx-font-display) !important;
	font-size: 19px !important;
	font-weight: 800 !important;
	letter-spacing: 0.02em !important;
	color: #ffffff !important;
	background: linear-gradient(135deg, #ffffff 40%, var(--hx-gold) 100%) !important;
	-webkit-background-clip: text !important;
	background-clip: text !important;
	-webkit-text-fill-color: transparent !important;
	border-bottom: 1px solid rgba(208, 184, 120, 0.25) !important;
	padding-bottom: 8px !important;
	margin-bottom: 10px !important;
	display: flex !important;
	align-items: center !important;
}

.room-view > .container > h1::before {
	content: "";
	display: inline-block;
	width: 8px;
	height: 8px;
	margin-right: 9px;
	border-radius: 50%;
	background: var(--hx-gold);
	box-shadow: 0 0 8px var(--hx-gold);
}

/* Equipos como tarjetas gamer */
.room-view .teams {
	display: grid !important;
	grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
	align-items: stretch !important;
	gap: 8px !important;
	width: min(100%, 640px) !important;
	max-width: 640px !important;
	margin: 0 auto !important;
	box-sizing: border-box !important;
	padding-left: 0 !important;
}

.room-view .teams .player-list-view.t-red { grid-column: 1; grid-row: 1; }
.room-view .teams .player-list-view.t-blue { grid-column: 3; grid-row: 1; }
.room-view .teams .player-list-view:not(.t-red):not(.t-blue) { grid-column: 2; grid-row: 1; }
.room-view .teams > .controls {
	grid-column: 1 / -1 !important;
	grid-row: 3 !important;
}

.room-view .controls {
	display: flex !important;
	flex-wrap: wrap !important;
	justify-content: center !important;
	gap: 8px !important;
	width: min(100%, 640px) !important;
	max-width: 640px !important;
	margin: 8px auto 0 !important;
}

.room-view .hx-team-actions {
	position: static !important;
	grid-column: 1 / -1 !important;
	grid-row: 2 !important;
	display: grid !important;
	grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
	align-items: center !important;
	gap: 8px !important;
	width: min(100%, 640px) !important;
	max-width: 640px !important;
	margin: 10px auto 0 !important;
}

.room-view .hx-team-actions button {
	width: 100% !important;
	min-width: 0 !important;
	margin: 0 !important;
	padding: 6px 8px !important;
}

.room-view .teams .player-list-view {
	background: rgba(10, 18, 34, 0.8) !important;
	border-radius: 12px !important;
	padding: 8px !important;
	width: 100% !important;
	min-width: 0 !important;
	box-sizing: border-box !important;
	height: clamp(150px, 22vh, 190px) !important;
	min-height: 0 !important;
	max-height: 190px !important;
	overflow: hidden !important;
	border: 1px solid rgba(255, 255, 255, 0.08) !important;
	transition: border-color 0.15s ease !important;
}

.room-view .teams .player-list-view.t-red {
	background: linear-gradient(180deg, rgba(239, 68, 68, 0.16) 0%, rgba(12, 20, 36, 0.88) 100%) !important;
	border: 1px solid rgba(239, 68, 68, 0.4) !important;
	border-top: 4px solid var(--hx-red) !important;
	box-shadow: 0 10px 25px rgba(239, 68, 68, 0.15) !important;
}

.room-view .teams .player-list-view.t-blue {
	background: linear-gradient(180deg, rgba(59, 130, 246, 0.16) 0%, rgba(12, 20, 36, 0.88) 100%) !important;
	border: 1px solid rgba(59, 130, 246, 0.4) !important;
	border-top: 4px solid var(--hx-blue) !important;
	box-shadow: 0 10px 25px rgba(59, 130, 246, 0.15) !important;
}

.room-view .teams .player-list-view:not(.t-red):not(.t-blue) {
	border-top: 4px solid var(--hx-gold) !important;
}

.room-view .teams .player-list-view .list {
	background: rgba(0, 0, 0, 0.22) !important;
	border-radius: 8px !important;
	padding: 3px !important;
	min-width: 0 !important;
	min-height: 0 !important;
	overflow-y: auto !important;
}

/* Jugadores en la lista */
.player-list-item {
	border-radius: 6px !important;
	padding: calc(4px * var(--hx-d)) 8px !important;
	margin: 1px 0 !important;
	background: rgba(255, 255, 255, 0.03) !important;
	border: 1px solid rgba(255, 255, 255, 0.04) !important;
	transition: all 0.15s ease !important;
}

.player-list-item:hover {
	background: rgba(208, 184, 120, 0.18) !important;
	border-color: rgba(208, 184, 120, 0.4) !important;
	transform: translateX(2px) !important;
}

.player-list-item .name {
	font-weight: 600 !important;
	color: #ffffff !important;
}

.player-list-item .p-ping {
	font-variant-numeric: tabular-nums !important;
	font-size: 11px !important;
	opacity: 0.85 !important;
	background: rgba(0, 0, 0, 0.35) !important;
	padding: 2px 6px !important;
	border-radius: 6px !important;
}

/* Opciones de la partida (Tiempo, Goles, Mapa) */
.room-view .settings {
	background: rgba(12, 21, 38, 0.85) !important;
	border: 1px solid var(--hx-card-border) !important;
	border-radius: 10px !important;
	padding: 7px 10px !important;
	box-sizing: border-box !important;
	width: min(100%, 640px) !important;
	margin: 10px auto 0 !important;
}

.room-view .settings > div {
	display: grid !important;
	grid-template-columns: minmax(80px, 0.4fr) minmax(0, 1fr) auto !important;
	align-items: center !important;
	gap: 10px !important;
	min-height: 34px !important;
	padding-top: calc(3px * var(--hx-d)) !important;
	padding-bottom: calc(3px * var(--hx-d)) !important;
}

.room-view .settings input,
.room-view .settings select {
	width: min(100%, 180px) !important;
	min-width: 0 !important;
}

.room-view .settings .lbl {
	color: #a0b2c9 !important;
	font-weight: 600 !important;
	font-size: 12px !important;
}

/* Botones de control del host (Start, Pause, Reset, Stop) */
.room-view .controls button {
	border-radius: 8px !important;
	font-weight: 800 !important;
	letter-spacing: 0.01em !important;
	padding: 6px 12px !important;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
}

.room-view .controls button.hx-native-game-control {
	display: none !important;
}

.room-view .controls button.hx-room-game-toggle {
	min-width: 112px !important;
}

.room-view .controls button.green,
.room-view .controls button:has([data-hook=start]) {
	background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
	color: #ffffff !important;
	border: 1px solid #34d399 !important;
	box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35) !important;
}

.room-view .controls button.red,
.room-view .controls button:has([data-hook=stop]) {
	background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%) !important;
	color: #ffffff !important;
	border: 1px solid #f87171 !important;
	box-shadow: 0 4px 16px rgba(239, 68, 68, 0.35) !important;
}

/* ---------- Pantalla de Elegir Nickname ---------- */
.choose-nickname-view .dialog {
	width: min(420px, calc(100vw - 40px)) !important;
	max-width: 420px !important;
	padding: 24px !important;
	text-align: center !important;
	border-radius: 20px !important;
	box-sizing: border-box !important;
}

.choose-nickname-view .dialog h1 {
	font-size: 24px !important;
	margin: 0 0 16px !important;
	padding-bottom: 10px !important;
	border-bottom: 2px solid var(--hx-accent) !important;
}

.choose-nickname-view .dialog .label-input {
	display: grid !important;
	grid-template-columns: auto minmax(0, 1fr) !important;
	align-items: center !important;
	gap: 12px !important;
	width: 100% !important;
	margin: 0 0 14px !important;
	padding: 10px 12px !important;
	box-sizing: border-box !important;
	background: rgba(255, 255, 255, 0.06) !important;
	border: 1px solid rgba(208, 184, 120, 0.22) !important;
	border-radius: 14px !important;
}

.choose-nickname-view .dialog .label-input label {
	margin: 0 !important;
	color: #aebbd0 !important;
	font-size: 13px !important;
	font-weight: 700 !important;
}

.choose-nickname-view .dialog input[type=text] {
	width: 100% !important;
	min-width: 0 !important;
	height: 46px !important;
	margin: 0 !important;
	padding: 0 14px !important;
	font-size: 15px !important;
	font-weight: 600 !important;
	text-align: center !important;
	border-radius: 999px !important;
	background: rgba(8, 16, 31, 0.8) !important;
	border: 1px solid rgba(208, 184, 120, 0.3) !important;
}

.choose-nickname-view .dialog > button[data-hook="ok"] {
	display: block !important;
	position: relative !important;
	z-index: 1 !important;
	pointer-events: auto !important;
	width: 100% !important;
	height: 46px !important;
	margin: 0 !important;
	font-size: 14px !important;
	border-radius: 12px !important;
	background: linear-gradient(135deg, var(--hx-gold) 0%, #ab9150 100%) !important;
	color: #0c1524 !important;
	border-color: rgba(255, 255, 255, 0.18) !important;
	box-shadow: 0 4px 18px rgba(208, 184, 120, 0.28) !important;
}

/* Formulario de creacion de sala: compacta filas y controles sin estirar el modal. */
.create-room-view .dialog {
	width: min(380px, calc(100vw - 32px)) !important;
	max-width: 380px !important;
	padding: 18px !important;
	box-sizing: border-box !important;
}

.create-room-view .dialog h1 {
	margin: 0 0 14px !important;
	padding-bottom: 9px !important;
	font-size: 20px !important;
	border-bottom: 2px solid var(--hx-accent) !important;
}

.create-room-view .dialog .label-input {
	display: grid !important;
	grid-template-columns: 88px minmax(0, 1fr) !important;
	align-items: center !important;
	gap: 10px !important;
	width: 100% !important;
	margin: 0 0 8px !important;
	padding: 0 !important;
	background: transparent !important;
	box-sizing: border-box !important;
}

.create-room-view .dialog .label-input label {
	margin: 0 !important;
	color: #b7c4d9 !important;
	font-size: 12px !important;
	font-weight: 600 !important;
}

.create-room-view .dialog .label-input input,
.create-room-view .dialog .label-input select {
	width: 100% !important;
	min-width: 0 !important;
	height: 36px !important;
	margin: 0 !important;
	padding: 0 11px !important;
	font-size: 13px !important;
	border-radius: 9px !important;
}

.create-room-view .dialog > button[data-hook="unlisted"] {
	width: 100% !important;
	min-height: 34px !important;
	margin: 2px 0 8px !important;
	padding: 6px 10px !important;
	font-size: 12px !important;
}

.create-room-view .dialog .row {
	display: flex !important;
	gap: 8px !important;
	width: 100% !important;
}

.create-room-view .dialog .row button {
	flex: 1 1 0 !important;
	width: auto !important;
	min-width: 0 !important;
	min-height: 36px !important;
	margin: 0 !important;
	padding: 7px 12px !important;
	font-size: 13px !important;
	border-radius: 9px !important;
}

.create-room-view .dialog .row button[data-hook="create"] {
	background: linear-gradient(135deg, var(--hx-gold) 0%, #ab9150 100%) !important;
	color: #0c1524 !important;
}

/* ---------- Dentro de la Partida (HUD & Chat) ---------- */
.chatbox-view-contents > .input input[type=text] {
	border-radius: 999px !important;
	padding-left: 16px !important;
	background: rgba(10, 19, 34, 0.85) !important;
	border: 1px solid rgba(208, 184, 120, 0.35) !important;
	box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4) !important;
}

.chatbox-view-contents > .input input[type=text]:focus {
	border-color: var(--hx-gold) !important;
	box-shadow: 0 0 14px rgba(208, 184, 120, 0.4) !important;
}

.chatbox-view-contents > .log .log-contents p {
	text-shadow: 1px 1px 2px #000, 0 0 2px #000 !important;
	line-height: 1.35 !important;
}

/* Marcador compacto: conserva el espacio de la cancha y destaca la lectura del resultado. */
.game-view .scoreboard {
	display: inline-flex !important;
	align-items: center !important;
	gap: 8px !important;
	padding: 7px 12px !important;
	border: 1px solid rgba(255, 255, 255, 0.14) !important;
	border-radius: 12px !important;
	background: rgba(8, 16, 31, 0.86) !important;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.32) !important;
	backdrop-filter: blur(var(--hx-blur)) !important;
	font-variant-numeric: tabular-nums !important;
}

.game-view .scoreboard .score {
	min-width: 1.2em !important;
	text-align: center !important;
	font-weight: 800 !important;
}

.game-view > .buttons {
	gap: 8px !important;
}

.game-view > .buttons button,
.game-view .bar button {
	min-height: 34px !important;
	border-radius: 10px !important;
	background: rgba(9, 17, 32, 0.82) !important;
	border: 1px solid rgba(255, 255, 255, 0.14) !important;
	box-shadow: 0 5px 16px rgba(0, 0, 0, 0.25) !important;
	backdrop-filter: blur(var(--hx-blur)) !important;
}

html[data-hx-stage="game"] body {
	background: #08101f !important;
}

html[data-hx-stage="game"] body::before {
	display: none !important;
}

html[data-hx-stage="game"] .game-view .scoreboard,
html[data-hx-stage="game"] .game-view > .buttons button,
html[data-hx-stage="game"] .game-view .bar button {
	backdrop-filter: none !important;
	box-shadow: none !important;
}

/* ---------- Cabecera TL App ---------- */
.header.tl-header {
	background: linear-gradient(180deg, #13243f 0%, #0a1426 100%) !important;
	border-bottom: 1px solid rgba(208, 184, 120, 0.35) !important;
	box-shadow: 0 6px 25px rgba(0, 0, 0, 0.45) !important;
	padding: 0 16px !important;
	box-sizing: border-box !important;
}

.header.tl-header::after {
	content: "";
	position: absolute;
	left: 0;
	right: 0;
	bottom: -1px;
	height: 1px;
	pointer-events: none;
	background: linear-gradient(90deg, transparent, var(--hx-gold), transparent);
	opacity: 0.9;
}

.tl-wordmark {
	font-family: var(--hx-font-display) !important;
	font-weight: 800 !important;
	font-size: 20px !important;
	letter-spacing: 0.14em !important;
	text-transform: uppercase !important;
	vertical-align: middle !important;
	background: linear-gradient(180deg, #ffffff 10%, var(--hx-gold) 100%) !important;
	-webkit-background-clip: text !important;
	background-clip: text !important;
	-webkit-text-fill-color: transparent !important;
}

/* crest y bloques azules heredados del header original */
.header.tl-header .tl-brand { display: inline-flex !important; align-items: center; gap: 12px; background: none !important; box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 !important; }
.tl-crest { height: 38px !important; width: 38px !important; max-width: 38px !important; object-fit: contain; margin: 0 !important; filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.55)); }
.tl-brand-text { display: inline-flex; flex-direction: column; justify-content: center; line-height: 1; gap: 4px; }
.header.tl-header a.tl-wordmark {
	font-family: var(--hx-font-display) !important; font-weight: 800 !important; font-size: 21px !important; letter-spacing: 0.18em !important; text-transform: uppercase !important;
	line-height: 1 !important; padding: 0 !important; margin: 0 !important; border: none !important; text-decoration: none !important; display: block !important;
	background: linear-gradient(180deg, #ffffff 15%, var(--hx-gold) 100%) !important; -webkit-background-clip: text !important; background-clip: text !important; -webkit-text-fill-color: transparent !important;
}
.tl-sub { font: 600 10px var(--hx-font) !important; letter-spacing: 0.34em; text-transform: uppercase; color: rgba(208, 184, 120, 0.85); }
.header.tl-header .right-container .title {
	background: rgba(208, 184, 120, 0.1) !important; border: 1px solid rgba(208, 184, 120, 0.4) !important; border-radius: 999px !important;
	padding: 0 16px !important; box-shadow: none !important; margin-left: 0 !important; height: 32px; display: inline-flex; align-items: center;
}
.header.tl-header .right-container .title a { background: none !important; color: #f3ead2 !important; font-weight: 700; padding: 0 !important; }

/* ---------- Scrollbars y Detalles ---------- */
::-webkit-scrollbar {
	width: 8px !important;
	height: 8px !important;
}

::-webkit-scrollbar-track {
	background: rgba(6, 12, 22, 0.7) !important;
}

::-webkit-scrollbar-thumb {
	background: rgba(208, 184, 120, 0.4) !important;
	border-radius: 999px !important;
	border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

::-webkit-scrollbar-thumb:hover {
	background: rgba(208, 184, 120, 0.75) !important;
	box-shadow: 0 0 10px rgba(208, 184, 120, 0.4) !important;
}

::selection {
	background: rgba(208, 184, 120, 0.35) !important;
	color: #ffffff !important;
}

@media (max-width: 720px) {
	.roomlist-view .dialog {
		width: calc(100vw - 24px) !important;
	}

	.room-view > .container {
		width: calc(100vw - 24px) !important;
		padding: 10px !important;
	}

	.room-view .teams {
		gap: 5px !important;
	}

	.room-view .teams > .controls {
		grid-row: 3 !important;
	}

	.room-view .hx-team-actions {
		gap: 5px !important;
	}

	.room-view .teams .player-list-view {
		height: clamp(120px, 22vh, 180px) !important;
	}

	.choose-nickname-view .dialog {
		width: calc(100vw - 32px) !important;
		padding: 18px !important;
	}

	.choose-nickname-view .dialog .label-input {
		gap: 8px !important;
		padding: 8px !important;
	}

}
`;
};
