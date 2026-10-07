// panel.ts
// Barra lateral con paneles de personalizacion: Aspecto, Rendim., Cancha y Ajustes.
// F9 la muestra / oculta. Por defecto se oculta sola dentro de una sala.

import { getLinesConfig, updateLinesLive } from "./lines";
import { BRAND_LOGO } from "./brand";
import { refreshBackground } from "./bg";
import { openSettingsAlert } from "./settings";
import { CLUB_THEME, PRESETS, getThemeConfig, isValidHex, updateThemeLive } from "./theme";
import { copyToClipboard, dumpUiStructure } from "./uidump";

const STYLE_ID = "hax-panel-style";
const ROOT_ID = "hax-panel-root";
const WIDTH = 72;

type SectionId = "look" | "perf" | "pitch" | "settings";

const ICONS: Record<SectionId, string> = {
	look: '<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10" r="1.2"/><circle cx="12" cy="7.5" r="1.2"/><circle cx="15.5" cy="10" r="1.2"/><path d="M12 21c-1.5 0-2-1.2-1.4-2.3.6-1 .2-2.2-1-2.2H8"/>',
	perf: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
	pitch: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 5v14"/><circle cx="12" cy="12" r="3"/>',
	settings: '<path d="M4 6h8m4 0h4M4 12h2m4 0h10M4 18h10m4 0h2"/><circle cx="14" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
};

const SECTIONS: { id: SectionId; label: string; title: string }[] = [
	{ id: "look", label: "Aspecto", title: "Aspecto" },
	{ id: "perf", label: "Rendim.", title: "Rendimiento" },
	{ id: "pitch", label: "Cancha", title: "Cancha y lineas" },
	{ id: "settings", label: "Ajustes", title: "Ajustes" },
];

const CSS = `
#${ROOT_ID} { position: fixed; top: 0; left: 0; bottom: 0; z-index: 2147483000; font-family: inherit; color: #e6e9ee; }
#${ROOT_ID} .hx-hot { position: fixed; top: 0; left: 0; bottom: 0; width: 8px; z-index: 1; }
#${ROOT_ID}.hx-open .hx-hot, #${ROOT_ID}.hx-nohot .hx-hot { display: none; }
#${ROOT_ID} .hx-logo { display: none; width: 46px; height: 46px; margin-bottom: 6px; border-radius: 12px; background: center / contain no-repeat; flex: 0 0 auto; }
#${ROOT_ID} .hx-logo.on { display: block; }
#${ROOT_ID} .hx-logo-preview { width: 52px; height: 52px; border-radius: 12px; background: rgba(255,255,255,.05) center / contain no-repeat; }
#${ROOT_ID}:not(.hx-open) .hx-drawer { opacity: 0 !important; pointer-events: none !important; transform: translateX(-12px) !important; }
#${ROOT_ID} .hx-bar { position: absolute; top: 0; left: 0; bottom: 0; width: ${WIDTH}px; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 0; background: rgba(10,12,16,.88); backdrop-filter: blur(10px); border-right: 1px solid rgba(255,255,255,.06); transform: translateX(-100%); transition: transform .18s ease; pointer-events: none; }
#${ROOT_ID}.hx-open .hx-bar { transform: none; pointer-events: auto; }
#${ROOT_ID} .hx-nav { width: 56px; padding: 8px 0 6px; display: flex; flex-direction: column; align-items: center; gap: 4px; background: transparent !important; border: 1px solid transparent !important; color: #9aa3b2 !important; cursor: pointer; font-size: 10px; font-weight: 600; }
#${ROOT_ID} .hx-nav:hover { color: #fff !important; background: rgba(255,255,255,.06) !important; }
#${ROOT_ID} .hx-nav.on { color: #fff !important; background: var(--hx-accent-soft, rgba(59,130,246,.3)) !important; border-color: var(--hx-accent, #3b82f6) !important; }
#${ROOT_ID} .hx-nav svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
#${ROOT_ID} .hx-spacer { flex: 1; }
#${ROOT_ID} .hx-drawer { position: absolute; top: 0; left: ${WIDTH}px; bottom: 0; width: 340px; padding: 18px 18px 24px; overflow-y: auto; box-sizing: border-box; background: rgba(13,16,21,.96); backdrop-filter: blur(14px); border-right: 1px solid rgba(255,255,255,.06); box-shadow: 8px 0 30px rgba(0,0,0,.35); transform: translateX(-12px); opacity: 0; pointer-events: none; transition: transform .18s ease, opacity .18s ease; }
#${ROOT_ID} .hx-drawer.open { transform: none; opacity: 1; pointer-events: auto; }
#${ROOT_ID} h2 { margin: 0 0 4px; font-size: 18px; color: #fff; }
#${ROOT_ID} .hx-sub { margin: 0 0 16px; font-size: 12px; color: #8b94a3; line-height: 1.4; }
#${ROOT_ID} .hx-group { margin: 18px 0 8px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #8b94a3; font-weight: 700; }
#${ROOT_ID} .hx-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 9px 0; border-bottom: 1px solid rgba(255,255,255,.05); }
#${ROOT_ID} .hx-label { font-size: 13px; font-weight: 600; color: #e6e9ee; }
#${ROOT_ID} .hx-hint { display: block; margin-top: 2px; font-size: 11px; font-weight: 400; color: #8b94a3; line-height: 1.3; }
#${ROOT_ID} .hx-tag { display: inline-block; margin-left: 6px; padding: 1px 6px; font-size: 10px; border-radius: 6px; background: rgba(255,255,255,.08); color: #b7bfcc; font-weight: 600; }
#${ROOT_ID} .hx-switch { position: relative; flex: 0 0 auto; width: 38px; height: 22px; }
#${ROOT_ID} .hx-switch input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; z-index: 1; }
#${ROOT_ID} .hx-switch span { position: absolute; inset: 0; border-radius: 22px; background: rgba(255,255,255,.14); transition: background .15s; pointer-events: none; }
#${ROOT_ID} .hx-switch span::after { content: ""; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: transform .15s; }
#${ROOT_ID} .hx-switch input:checked + span { background: var(--hx-accent, #3b82f6); }
#${ROOT_ID} .hx-switch input:checked + span::after { transform: translateX(16px); }
#${ROOT_ID} .hx-slider { display: flex; align-items: center; gap: 10px; flex: 0 0 160px; }
#${ROOT_ID} .hx-slider input { flex: 1; min-width: 0; accent-color: var(--hx-accent, #3b82f6); }
#${ROOT_ID} .hx-val { flex: 0 0 38px; text-align: right; font-size: 12px; color: #b7bfcc; font-variant-numeric: tabular-nums; }
#${ROOT_ID} .hx-swatches { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: flex-end; max-width: 170px; }
#${ROOT_ID} .hx-dot { width: 24px; height: 24px; padding: 0 !important; border-radius: 50% !important; border: none !important; cursor: pointer; outline: 2px solid transparent; outline-offset: 2px; }
#${ROOT_ID} .hx-dot.on { outline-color: #fff; }
#${ROOT_ID} input[type=color] { width: 32px; height: 26px; padding: 0; border: none; background: none; cursor: pointer; }
#${ROOT_ID} .hx-btn { padding: 8px 12px; font-size: 13px; font-weight: 600; color: #fff; background: var(--hx-accent, #3b82f6); border: none; cursor: pointer; }
#${ROOT_ID} .hx-btn:hover { background: var(--hx-accent-hover, #5b9bf8); }
#${ROOT_ID} .hx-btn.ghost { background: rgba(255,255,255,.08); }
#${ROOT_ID} .hx-btn.ghost:hover { background: rgba(255,255,255,.14); }
#${ROOT_ID} .hx-seg { display: flex; flex: 0 0 auto; padding: 2px; gap: 2px; border-radius: 10px; background: rgba(255,255,255,.06); }
#${ROOT_ID} .hx-seg button { padding: 5px 10px; font-size: 12px; font-weight: 600; color: #b7bfcc !important; background: transparent !important; border: none !important; cursor: pointer; }
#${ROOT_ID} .hx-seg button.on { color: #fff !important; background: var(--hx-accent, #3b82f6) !important; }
#${ROOT_ID} .hx-banner { margin-top: 16px; padding: 10px 12px; font-size: 12px; line-height: 1.4; border-radius: 8px; background: rgba(250,170,60,.12); border: 1px solid rgba(250,170,60,.35); color: #f5c27a; }
#${ROOT_ID} .hx-banner .hx-btn { margin-top: 8px; width: 100%; }
`;

const SAVE = (key: string, value: any): void => {
	try { window.electronAPI.setAppPreference(key, value); } catch { /* sin preload */ }
};

// ---- constructores de filas --------------------------------------------------

const el = <K extends keyof HTMLElementTagNameMap>(
	tag: K,
	className?: string,
	text?: string
): HTMLElementTagNameMap[K] => {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text !== undefined) node.textContent = text;
	return node;
};

const labelBlock = (label: string, hint?: string, tag?: string): HTMLDivElement => {
	const box = el("div", "hx-label", label);
	if (tag) box.appendChild(el("span", "hx-tag", tag));
	if (hint) box.appendChild(el("span", "hx-hint", hint));
	return box;
};

const group = (title: string): HTMLDivElement => el("div", "hx-group", title);

const switchRow = (
	label: string,
	hint: string | undefined,
	value: boolean,
	onChange: (on: boolean) => void,
	tag?: string
): HTMLDivElement => {
	const row = el("div", "hx-row");
	const wrap = el("label", "hx-switch");
	const input = el("input");
	input.type = "checkbox";
	input.checked = value;
	input.addEventListener("change", () => onChange(input.checked));
	wrap.appendChild(input);
	wrap.appendChild(el("span"));
	row.appendChild(labelBlock(label, hint, tag));
	row.appendChild(wrap);
	return row;
};

const sliderRow = (
	label: string,
	value: number,
	min: number,
	max: number,
	step: number,
	format: (v: number) => string,
	onLive: (v: number) => void,
	onCommit: (v: number) => void,
	hint?: string
): HTMLDivElement => {
	const row = el("div", "hx-row");
	const box = el("div", "hx-slider");
	const input = el("input");
	input.type = "range";
	input.min = String(min);
	input.max = String(max);
	input.step = String(step);
	input.value = String(value);
	const out = el("span", "hx-val", format(value));
	input.addEventListener("input", () => {
		const v = Number(input.value);
		out.textContent = format(v);
		onLive(v);
	});
	input.addEventListener("change", () => onCommit(Number(input.value)));
	box.appendChild(input);
	box.appendChild(out);
	row.appendChild(labelBlock(label, hint));
	row.appendChild(box);
	return row;
};

const colorRow = (
	label: string,
	value: string,
	onLive: (hex: string) => void,
	onCommit: (hex: string) => void,
	extra?: HTMLElement,
	presets?: { name: string; hex: string }[],
	hint?: string
): HTMLDivElement => {
	const row = el("div", "hx-row");
	const box = el("div", "hx-swatches");
	const dots: HTMLButtonElement[] = [];
	const mark = (hex: string) =>
		dots.forEach((d) => d.classList.toggle("on", (d.dataset.hex || "").toLowerCase() === hex.toLowerCase()));

	const picker = el("input");
	picker.type = "color";
	picker.value = isValidHex(value) && value.length === 7 ? value : "#3b82f6";
	picker.title = "Color personalizado";

	(presets || []).forEach((p) => {
		const dot = el("button", "hx-dot");
		dot.title = p.name;
		dot.dataset.hex = p.hex;
		dot.style.setProperty("background", p.hex, "important");
		dot.addEventListener("click", () => {
			picker.value = p.hex;
			mark(p.hex);
			onLive(p.hex);
			onCommit(p.hex);
		});
		dots.push(dot);
		box.appendChild(dot);
	});
	picker.addEventListener("input", () => { mark(""); onLive(picker.value); });
	picker.addEventListener("change", () => onCommit(picker.value));
	box.appendChild(picker);
	if (extra) box.appendChild(extra);
	mark(value);
	row.appendChild(labelBlock(label, hint));
	row.appendChild(box);
	return row;
};

const segRow = (
	label: string,
	options: { value: string; text: string }[],
	value: string,
	onChange: (v: string) => void,
	hint?: string
): HTMLDivElement => {
	const row = el("div", "hx-row");
	const seg = el("div", "hx-seg");
	options.forEach((o) => {
		const b = el("button", o.value === value ? "on" : "", o.text);
		b.addEventListener("click", () => {
			seg.querySelectorAll("button").forEach((x) => x.classList.remove("on"));
			b.classList.add("on");
			onChange(o.value);
		});
		seg.appendChild(b);
	});
	row.appendChild(labelBlock(label, hint));
	row.appendChild(seg);
	return row;
};

// ---- secciones ------------------------------------------------------------------

let restartNeeded = false;

const restartSwitch = (label: string, hint: string, key: string, value: boolean, tag?: string, invert = false) =>
	switchRow(label, hint, invert ? !value : value, (on) => {
		SAVE(key, invert ? !on : on);
		restartNeeded = true;
		refreshBanner();
	}, tag);

const buildLook = async (): Promise<HTMLElement> => {
	const prefs = await window.electronAPI.getAppPreferences();
	const t = getThemeConfig();
	const box = el("div");
	box.appendChild(el("h2", "", "Aspecto"));
	box.appendChild(el("p", "hx-sub", "Todo se aplica al instante y queda guardado."));

	box.appendChild(switchRow("Estilo moderno", "Apagado = look original de HaxBall", t.enabled, (on) => {
		updateThemeLive({ enabled: on });
		SAVE("theme_enabled", on);
	}));

	box.appendChild(switchRow("Interfaz de tarjetas", "Rediseno de la lista de salas, la sala del host y los menus", t.cards, (on) => {
		updateThemeLive({ cards: on });
		SAVE("theme_cards", on);
	}));
	box.appendChild(segRow("Estilo de tarjeta", [
		{ value: "glass", text: "Cristal" },
		{ value: "solid", text: "Solido" },
		{ value: "flat", text: "Plano" },
	], t.cardStyle, (v) => {
		updateThemeLive({ cardStyle: v as any });
		SAVE("theme_card_style", v);
	}, "Cristal usa desenfoque; se apaga solo con baja latencia"));
	box.appendChild(sliderRow("Densidad", t.density, 0.6, 1.6, 0.1,
		(v) => (v < 0.85 ? "Compacta" : v > 1.25 ? "Amplia" : "Normal"),
		(v) => updateThemeLive({ density: v }),
		(v) => SAVE("theme_density", v),
		"Espacio entre filas y bloques"));

	box.appendChild(group("Tema del club"));
	const club = el("button", "hx-btn", "Toda la Lecce (colores del escudo)");
	club.style.width = "100%";
	club.addEventListener("click", () => {
		updateThemeLive({ accent: CLUB_THEME.accent, accent2: CLUB_THEME.accent2, glow: "", enabled: true });
		SAVE("theme_accent", CLUB_THEME.accent);
		SAVE("theme_accent2", CLUB_THEME.accent2);
		SAVE("theme_glow", "");
		SAVE("theme_enabled", true);
		openSection = null;
		showSection("look"); // recargar los controles con los colores nuevos
	});
	box.appendChild(club);
	box.appendChild(buildLogoRow());

	box.appendChild(group("Colores"));
	box.appendChild(colorRow("Color de acento", t.accent,
		(hex) => updateThemeLive({ accent: hex, enabled: true }),
		(hex) => { SAVE("theme_accent", hex); SAVE("theme_enabled", true); },
		undefined, PRESETS));

	const noSecond = el("button", "hx-btn ghost", "Quitar");
	noSecond.addEventListener("click", () => {
		updateThemeLive({ accent2: "" });
		SAVE("theme_accent2", "");
	});
	box.appendChild(colorRow("Color secundario", t.accent2 || t.accent,
		(hex) => updateThemeLive({ accent2: hex }),
		(hex) => SAVE("theme_accent2", hex),
		noSecond, undefined, "Detalles y segundo brillo (amarillo en el tema del club)"));

	const sameAsAccent = el("button", "hx-btn ghost", "= acento");
	sameAsAccent.title = "Usar el mismo color que el acento";
	sameAsAccent.addEventListener("click", () => {
		updateThemeLive({ glow: "" });
		SAVE("theme_glow", "");
	});
	box.appendChild(colorRow("Brillo de fondo", t.glow || t.accent,
		(hex) => updateThemeLive({ glow: hex }),
		(hex) => SAVE("theme_glow", hex),
		sameAsAccent, undefined, "El resplandor detras de la lista de salas"));
	box.appendChild(sliderRow("Intensidad del brillo", t.glowStrength, 0, 1, 0.05,
		(v) => `${Math.round(v * 100)}%`,
		(v) => updateThemeLive({ glowStrength: v }),
		(v) => SAVE("theme_glow_strength", v)));

	box.appendChild(group("Forma y tamano"));
	box.appendChild(sliderRow("Esquinas", t.radius, 0, 20, 1, (v) => `${v}px`,
		(v) => updateThemeLive({ radius: v }),
		(v) => SAVE("theme_radius", v)));
	box.appendChild(sliderRow("Zoom de la interfaz", Number(prefs?.ui_zoom) || 1, 0.8, 1.4, 0.05,
		(v) => `${Math.round(v * 100)}%`,
		(v) => window.electronAPI.setZoom?.(v),
		(v) => SAVE("ui_zoom", v),
		"Agranda o achica toda la app"));

	box.appendChild(group("Barra lateral"));
	box.appendChild(switchRow("Aparecer al acercar el mouse", "Pasa el mouse por el borde izquierdo; se esconde sola al salir. F9 la deja fija",
		hoverEnabled, (on) => { hoverEnabled = on; SAVE("panel_hover", on); updateVisibility(); }));
	box.appendChild(switchRow("Tambien dentro de una sala", "Apagado: en partida solo aparece con F9, asi no salta sin querer",
		hoverInGame, (on) => { hoverInGame = on; SAVE("panel_hover_ingame", on); updateVisibility(); }));
	return box;
};

const buildPerf = async (): Promise<HTMLElement> => {
	const p = await window.electronAPI.getAppPreferences();
	const box = el("div");
	box.appendChild(el("h2", "", "Rendimiento"));
	box.appendChild(el("p", "hx-sub", "Opciones para bajar el delay. Las marcadas con reinicio se leen una sola vez al abrir la app."));

	box.appendChild(group("Recomendado"));
	box.appendChild(restartSwitch("Modo baja latencia", "Sin recorte de rendimiento en segundo plano, GPU para el canvas y sin limite de eventos de teclado", "low_latency", p?.low_latency === true, "reinicio"));
	box.appendChild(restartSwitch("FPS ilimitado", "Sin vsync ni tope de cuadros. Puede verse algo de tearing", "fps_unlock", p?.fps_unlock === true, "reinicio"));
	box.appendChild(restartSwitch("GPU dedicada", "En laptops con dos placas, usa la potente", "force_gpu", p?.force_gpu === true, "reinicio"));
	box.appendChild(restartSwitch("Prioridad alta de CPU", "El sistema atiende primero a la app cuando la PC esta cargada", "high_priority", p?.high_priority === true, "reinicio"));

	box.appendChild(group("Experimental"));
	box.appendChild(switchRow("Canvas de baja latencia", "Pide al navegador un canvas desincronizado. Sirve desde la proxima sala que abras",
		p?.canvas_desync === true, (on) => { updateLinesLive({ desync: on }); SAVE("canvas_desync", on); }, "sala nueva"));
	box.appendChild(restartSwitch("GPU en el mismo proceso", "Menos comunicacion entre procesos, pero si la GPU falla se cierra la app", "in_process_gpu", p?.in_process_gpu === true, "reinicio"));
	box.appendChild(restartSwitch("Extension All-in-one", "Apagarla ahorra CPU pero se pierden sus funciones (busqueda, emojis, etc.)", "disable_extension", p?.disable_extension === true, "reinicio", true));
	return box;
};

const buildPitch = async (): Promise<HTMLElement> => {
	const p = await window.electronAPI.getAppPreferences();
	const l = getLinesConfig();
	const box = el("div");
	box.appendChild(el("h2", "", "Cancha y lineas"));
	box.appendChild(el("p", "hx-sub", "Se ve al entrar a una sala. F8 prende y apaga las lineas finas."));

	box.appendChild(group("Fondo de afuera"));
	box.appendChild(switchRow("Degradé en vez del pasto verde", "Menu de salas y borde de la sala (al apretar ESC), con los colores del escudo", l.bgEnabled, (on) => {
		updateLinesLive({ bgEnabled: on });
		SAVE("bg_enabled", on);
		refreshBackground();
	}));
	box.appendChild(colorRow("Color de arriba", l.bgFrom,
		(hex) => { updateLinesLive({ bgFrom: hex, bgEnabled: true }); refreshBackground(); },
		(hex) => { SAVE("bg_from", hex); SAVE("bg_enabled", true); },
		undefined, undefined, "Por defecto: azul del escudo"));
	box.appendChild(colorRow("Color de abajo", l.bgTo,
		(hex) => { updateLinesLive({ bgTo: hex, bgEnabled: true }); refreshBackground(); },
		(hex) => { SAVE("bg_to", hex); SAVE("bg_enabled", true); },
		undefined, undefined, "Por defecto: azul oscuro"));

	box.appendChild(group("Textura"));
	box.appendChild(switchRow("Cancha plana", "Sin textura de pasto ni cemento", l.flatPitch, (on) => {
		updateLinesLive({ flatPitch: on });
		SAVE("pitch_flat", on);
	}));
	const auto = el("button", "hx-btn ghost", "Auto");
	auto.title = "Usar el color promedio de la textura";
	auto.addEventListener("click", () => {
		updateLinesLive({ flatColor: "" });
		SAVE("pitch_flat_color", "");
	});
	box.appendChild(colorRow("Color de la cancha", l.flatColor || "#718c5a",
		(hex) => updateLinesLive({ flatColor: hex, flatPitch: true }),
		(hex) => { SAVE("pitch_flat_color", hex); SAVE("pitch_flat", true); },
		auto, undefined, "Auto = promedio de la textura"));

	box.appendChild(group("Grosor de lineas"));
	box.appendChild(switchRow("Lineas personalizadas", "Apagado = grosores originales (3 / 2 / 2)", l.enabled, (on) => {
		updateLinesLive({ enabled: on });
		SAVE("lines_enabled", on);
	}));
	const fmt = (v: number) => v.toFixed(1);
	const slider = (label: string, key: "field" | "ball" | "players", pref: string) =>
		sliderRow(label, l[key], 0, 6, 0.1, fmt, (v) => updateLinesLive({ [key]: v }), (v) => SAVE(pref, v));
	box.appendChild(slider("Lineas de cancha", "field", "line_width_field"));
	box.appendChild(slider("Pelota y objetos", "ball", "line_width_ball"));
	box.appendChild(slider("Jugadores", "players", "line_width_players"));
	return box;
};

const buildSettings = async (): Promise<HTMLElement> => {
	const box = el("div");
	box.appendChild(el("h2", "", "Ajustes"));
	box.appendChild(el("p", "hx-sub", "Atajos de chat, auth, backup y reinicio de la app."));
	const open = el("button", "hx-btn", "Abrir ajustes avanzados");
	open.style.width = "100%";
	open.addEventListener("click", () => { closeDrawer(); openSettingsAlert(); });
	box.appendChild(open);
	box.appendChild(group("Depuracion"));
	const dump = el("button", "hx-btn ghost", "Copiar estructura de la UI");
	dump.style.width = "100%";
	dump.addEventListener("click", async () => {
		const ok = await copyToClipboard(dumpUiStructure());
		dump.textContent = ok ? "Copiado! Pegalo en el chat" : "No se pudo copiar";
		setTimeout(() => (dump.textContent = "Copiar estructura de la UI"), 2500);
	});
	box.appendChild(dump);
	box.appendChild(el("p", "hx-sub", "Copia un resumen de las clases y botones que hay en pantalla (sin chat ni datos tuyos). Abri la pantalla que quieras ajustar y tocalo.")).style.marginTop = "8px";
	box.appendChild(el("p", "hx-sub", "Atajos: F8 lineas finas · F9 mostrar/ocultar esta barra"));
	return box;
};

const BUILDERS: Record<SectionId, () => Promise<HTMLElement>> = {
	look: buildLook,
	perf: buildPerf,
	pitch: buildPitch,
	settings: buildSettings,
};

// ---- armado general ----------------------------------------------------------------

let root: HTMLDivElement | null = null;
let drawer: HTMLDivElement | null = null;
let content: HTMLDivElement | null = null;
let banner: HTMLDivElement | null = null;
let logoEl: HTMLDivElement | null = null;
let openSection: SectionId | null = null;

// visibilidad: se muestra si esta fijada con F9 o si el mouse esta encima
let hoverEnabled = true; // aparecer al acercar el mouse al borde
let hoverInGame = false; // lo mismo, pero dentro de una sala
let pinned = false; // F9
let hovering = false;
let pointerInside = false;
let dragging = false; // arrastrando un slider (el mouse puede salir del panel)
let holdOpen = false; // selector de color / de archivo abierto
let hideTimer: number | undefined;
let lastInGame = false;

const refreshBanner = (): void => {
	if (!banner) return;
	banner.style.display = restartNeeded ? "block" : "none";
};

const closeDrawer = (): void => {
	openSection = null;
	drawer?.classList.remove("open");
	root?.querySelectorAll(".hx-nav").forEach((n) => n.classList.remove("on"));
};

const showSection = async (id: SectionId): Promise<void> => {
	if (!drawer || !content) return;
	if (openSection === id) { closeDrawer(); return; }
	openSection = id;
	root?.querySelectorAll(".hx-nav").forEach((n) =>
		n.classList.toggle("on", (n as HTMLElement).dataset.section === id));
	content.innerHTML = "";
	try {
		content.appendChild(await BUILDERS[id]());
	} catch (error) {
		console.error("[panel]", error);
		content.appendChild(el("p", "hx-sub", "No se pudo cargar esta seccion."));
	}
	drawer.classList.add("open");
};

const isInGame = (): boolean => {
	try {
		const frame = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement | undefined;
		return !!frame?.contentDocument?.querySelector(".game-view");
	} catch {
		return false;
	}
};

const hotAllowed = (): boolean => hoverEnabled && (hoverInGame || !lastInGame);

const applyOpen = (): void => {
	if (!root) return;
	const open = pinned || hovering;
	root.classList.toggle("hx-open", open);
	if (!open) closeDrawer();
};

const updateVisibility = (): void => {
	if (!root) return;
	const inGame = isInGame();
	if (inGame !== lastInGame) { // al entrar / salir de una sala se empieza de cero
		lastInGame = inGame;
		pinned = false;
		hovering = false;
	}
	root.classList.toggle("hx-nohot", !hotAllowed());
	// red de seguridad: si quedo abierta por el mouse pero ya no hay nada que la
	// retenga (el mouse salio de la ventana sin avisar), se programa el cierre
	if (hovering && !pinned && !pointerInside && !dragging && !holdOpen && hideTimer === undefined) {
		scheduleHide();
	}
	applyOpen();
};

const cancelHide = (): void => {
	if (hideTimer !== undefined) { window.clearTimeout(hideTimer); hideTimer = undefined; }
};

const scheduleHide = (): void => {
	cancelHide();
	hideTimer = window.setTimeout(() => {
		hideTimer = undefined;
		if (pointerInside || dragging || holdOpen) return;
		hovering = false;
		applyOpen();
	}, 350);
};

// Mientras hay un selector nativo abierto (color, archivo) el mouse sale de la
// pagina; no escondemos hasta que se cierre (clic afuera o la ventana recupera foco).
export const holdUntilDone = (): void => {
	holdOpen = true;
	const release = () => {
		holdOpen = false;
		document.removeEventListener("mousedown", onDown, true);
		if (!pointerInside) scheduleHide();
	};
	const onDown = (e: MouseEvent) => {
		if (!root?.contains(e.target as Node)) release();
	};
	document.addEventListener("mousedown", onDown, true);
	window.addEventListener("focus", () => window.setTimeout(release, 400), { once: true });
};

export const togglePanel = (): void => {
	if (!root) return;
	pinned = !pinned;
	if (!pinned) hovering = false;
	applyOpen();
};

// ---- escudo del club (imagen propia) -------------------------------------------

const setLogo = (url: string): void => {
	if (!logoEl) return;
	const ok = typeof url === "string" && url.startsWith("data:image/");
	logoEl.style.backgroundImage = ok ? `url("${url}")` : "";
	logoEl.classList.toggle("on", ok);
};

const fileToLogo = (file: File, size: number): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(reader.error);
		reader.onload = () => {
			const img = new Image();
			img.onerror = () => reject(new Error("imagen invalida"));
			img.onload = () => {
				const canvas = document.createElement("canvas");
				canvas.width = size;
				canvas.height = size;
				const ctx = canvas.getContext("2d");
				if (!ctx) return reject(new Error("sin canvas"));
				const scale = Math.min(size / img.width, size / img.height);
				const w = img.width * scale;
				const h = img.height * scale;
				ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
				resolve(canvas.toDataURL("image/png"));
			};
			img.src = String(reader.result);
		};
		reader.readAsDataURL(file);
	});

function buildLogoRow(): HTMLDivElement {
	const row = el("div", "hx-row");
	const preview = el("div", "hx-logo-preview");
	const refreshPreview = () => {
		preview.style.backgroundImage = logoEl?.style.backgroundImage || "";
	};
	refreshPreview();

	const pick = el("button", "hx-btn", "Elegir imagen");
	pick.addEventListener("click", () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.addEventListener("change", async () => {
			const file = input.files?.[0];
			if (!file) return;
			try {
				const url = await fileToLogo(file, 128);
				SAVE("club_logo", url);
				setLogo(url);
				refreshPreview();
			} catch (error) {
				console.error("[panel] escudo", error);
			}
		});
		holdUntilDone();
		input.click();
	});
	const clear = el("button", "hx-btn ghost", "Quitar");
	clear.addEventListener("click", () => {
		SAVE("club_logo", "");
		setLogo(BRAND_LOGO);
		refreshPreview();
	});

	const buttons = el("div", "hx-swatches");
	buttons.appendChild(pick);
	buttons.appendChild(clear);
	row.appendChild(labelBlock("Escudo del club", "Tu propia imagen; aparece arriba en la barra lateral"));
	row.appendChild(preview);
	const wrap = el("div");
	wrap.style.cssText = "display:flex;flex-direction:column;gap:8px;";
	wrap.appendChild(row);
	wrap.appendChild(buttons);
	const outer = el("div");
	outer.appendChild(wrap);
	return outer;
}

// ---- armado ------------------------------------------------------------------------

export const startPanel = async (): Promise<void> => {
	if (document.getElementById(ROOT_ID)) return;

	let logo = BRAND_LOGO;
	try {
		const prefs = await window.electronAPI.getAppPreferences();
		hoverEnabled = prefs?.panel_hover ?? true;
		hoverInGame = prefs?.panel_hover_ingame ?? false;
		logo = typeof prefs?.club_logo === "string" && prefs.club_logo ? prefs.club_logo : BRAND_LOGO;
	} catch { /* valores por defecto */ }

	const style = document.createElement("style");
	style.id = STYLE_ID;
	style.textContent = CSS;
	document.head.appendChild(style);

	root = el("div");
	root.id = ROOT_ID;

	const hot = el("div", "hx-hot");
	hot.addEventListener("mouseenter", () => {
		if (!hotAllowed()) return;
		pointerInside = true;
		cancelHide();
		hovering = true;
		applyOpen();
	});

	const bar = el("div", "hx-bar");
	logoEl = el("div", "hx-logo");
	bar.appendChild(logoEl);
	setLogo(logo);
	SECTIONS.forEach((s) => {
		const btn = el("button", "hx-nav");
		btn.dataset.section = s.id;
		btn.title = s.title;
		btn.innerHTML = `<svg viewBox="0 0 24 24">${ICONS[s.id]}</svg><span>${s.label}</span>`;
		btn.addEventListener("click", () => showSection(s.id));
		bar.appendChild(btn);
	});

	drawer = el("div", "hx-drawer");
	content = el("div");
	banner = el("div", "hx-banner");
	banner.style.display = "none";
	banner.appendChild(el("div", "", "Hay cambios que se aplican al reiniciar la app."));
	const restart = el("button", "hx-btn", "Reiniciar ahora");
	restart.addEventListener("click", () => window.electronAPI.restartApp());
	banner.appendChild(restart);
	banner.appendChild(el("div", "hx-hint", "Si no se reabre sola, cerrala y abrila de nuevo."));
	drawer.appendChild(content);
	drawer.appendChild(banner);

	// el mouse sobre la barra o el panel lo mantiene abierto; al salir se esconde solo
	[bar, drawer].forEach((part) => {
		part.addEventListener("mouseenter", () => { pointerInside = true; cancelHide(); });
		part.addEventListener("mouseleave", () => { pointerInside = false; scheduleHide(); });
	});
	// arrastrar un slider puede sacar el mouse del panel: no esconder hasta soltar
	root.addEventListener("mousedown", () => { dragging = true; });
	document.addEventListener("mouseup", () => {
		if (!dragging) return;
		dragging = false;
		if (!pointerInside) scheduleHide();
	});
	// selector de color nativo
	root.addEventListener("click", (e) => {
		const t = e.target as HTMLElement;
		if (t instanceof HTMLInputElement && t.type === "color") holdUntilDone();
	});

	root.appendChild(hot);
	root.appendChild(bar);
	root.appendChild(drawer);
	document.body.appendChild(root);

	(window as any).__haxTogglePanel = togglePanel;
	updateVisibility();
	setInterval(updateVisibility, 500);
};
