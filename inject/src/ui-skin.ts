// ui-skin.ts
// Rediseño visual estético y moderno de HaxBall (lista de salas, sala del host,
// diálogos, controles y menús con estilo gaming / esports glassmorphic).

export type CardStyle = "glass" | "solid" | "flat";

export type SkinOptions = {
	cardStyle: CardStyle;
	density: number; // 0.6 compacto ... 1 normal ... 1.6 amplio
	lowGpu: boolean; // modo FPS máximo: sin blur ni animaciones
	noBlur?: boolean; // solo sin desenfoque
};

const clamp = (n: number, min: number, max: number): number =>
	Math.min(max, Math.max(min, n));

export const buildSkinCss = (o: SkinOptions): string => {
	const d = clamp(Number.isFinite(o.density) ? o.density : 1, 0.5, 1.8);
	const style: CardStyle = ["glass", "solid", "flat"].includes(o.cardStyle) ? o.cardStyle : "glass";
	const blur = o.lowGpu || o.noBlur || style !== "glass" ? 0 : 18;

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
	--hx-gold: #d0b878;
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

${o.lowGpu ? "* { transition: none !important; animation: none !important; }" : ""}
button, input, select, textarea {
	font-family: var(--hx-font) !important;
}

/* ---------- Diálogos y Modales generales ---------- */
.dialog, dialog {
	background: var(--hx-card-bg) !important;
	border: 1px solid var(--hx-card-border) !important;
	border-radius: calc(var(--hx-radius) + 8px) !important;
	box-shadow: var(--hx-card-shadow) !important;
	padding: calc(20px * var(--hx-d)) calc(24px * var(--hx-d)) !important;
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

.dialog hr {
	border: none !important;
	border-top: 1px solid var(--hx-card-border) !important;
	margin: 16px 0 !important;
}

/* ---------- Botones Generales Estilo Esports ---------- */
button, .btn {
	border-radius: var(--hx-radius) !important;
	font-weight: 700 !important;
	letter-spacing: 0.02em !important;
	font-size: 13px !important;
	padding: calc(8px * var(--hx-d)) calc(16px * var(--hx-d)) !important;
	background: linear-gradient(180deg, #182b4a 0%, #0e1b30 100%) !important;
	color: #e6edf3 !important;
	border: 1px solid rgba(208, 184, 120, 0.3) !important;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35) !important;
	cursor: pointer !important;
	transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
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
	width: min(1180px, 95vw) !important;
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
#searchRoom { height: 42px !important; border-radius: 999px !important; padding: 0 18px !important; box-sizing: border-box !important; }
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
	background: var(--hx-card-bg) !important;
	border: 1px solid var(--hx-card-border) !important;
	border-radius: 20px !important;
	box-shadow: var(--hx-card-shadow) !important;
	padding: calc(18px * var(--hx-d)) calc(22px * var(--hx-d)) 30px !important;
	max-width: 980px !important;
}

.room-view > .container > h1 {
	font-family: var(--hx-font-display) !important;
	font-size: 24px !important;
	font-weight: 800 !important;
	letter-spacing: 0.02em !important;
	color: #ffffff !important;
	background: linear-gradient(135deg, #ffffff 40%, var(--hx-gold) 100%) !important;
	-webkit-background-clip: text !important;
	background-clip: text !important;
	-webkit-text-fill-color: transparent !important;
	border-bottom: 1px solid rgba(208, 184, 120, 0.25) !important;
	padding-bottom: 14px !important;
	margin-bottom: 18px !important;
	display: flex !important;
	align-items: center !important;
}

.room-view > .container > h1::before {
	content: "";
	display: inline-block;
	width: 10px;
	height: 10px;
	margin-right: 12px;
	border-radius: 50%;
	background: var(--hx-gold);
	box-shadow: 0 0 12px var(--hx-gold);
}

/* Equipos como tarjetas gamer */
.room-view .teams .player-list-view {
	background: rgba(10, 18, 34, 0.8) !important;
	border-radius: 16px !important;
	padding: 12px !important;
	box-sizing: border-box !important;
	overflow: hidden !important;
	border: 1px solid rgba(255, 255, 255, 0.08) !important;
	transition: all 0.2s ease !important;
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
	border-radius: 10px !important;
	padding: 4px !important;
}

/* Jugadores en la lista */
.player-list-item {
	border-radius: 8px !important;
	padding: calc(5px * var(--hx-d)) 10px !important;
	margin: 2px 0 !important;
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
	border-radius: 14px !important;
	padding: 10px 16px !important;
	box-sizing: border-box !important;
}

.room-view .settings > div {
	padding-top: calc(5px * var(--hx-d)) !important;
	padding-bottom: calc(5px * var(--hx-d)) !important;
}

.room-view .settings .lbl {
	color: #a0b2c9 !important;
	font-weight: 600 !important;
	font-size: 13px !important;
}

/* Botones de control del host (Start, Pause, Reset, Stop) */
.room-view .controls button {
	border-radius: 10px !important;
	font-weight: 800 !important;
	letter-spacing: 0.03em !important;
	padding: 9px 18px !important;
	box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4) !important;
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
	max-width: 440px !important;
	padding: 30px !important;
	text-align: center !important;
	border-radius: 22px !important;
}

.choose-nickname-view .dialog h1 {
	font-size: 26px !important;
	margin-bottom: 20px !important;
}

.choose-nickname-view .dialog input[type=text] {
	width: 100% !important;
	height: 46px !important;
	font-size: 16px !important;
	font-weight: 600 !important;
	text-align: center !important;
	border-radius: 999px !important;
	margin-bottom: 16px !important;
}

.choose-nickname-view .dialog button {
	width: 100% !important;
	height: 46px !important;
	font-size: 15px !important;
	border-radius: 999px !important;
	background: linear-gradient(135deg, var(--hx-gold) 0%, #ab9150 100%) !important;
	color: #0c1524 !important;
	box-shadow: 0 4px 18px rgba(208, 184, 120, 0.35) !important;
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
`;
};
