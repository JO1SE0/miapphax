// extras.ts
// Comodidades dentro del juego, todas del lado del cliente (no tocan la red ni la fisica):
//  * chat: resalta los mensajes que te mencionan y suena un aviso (propio o generado)
//  * plantillas: Alt+1..9 mandan un mensaje guardado al chat
//  * equipo: marca en la lista de jugadores a tus companeros
//  * salas favoritas: avisa cuando una sala favorita aparece en la lista
//  * ultima sala: recuerda la sala y vuelve a ella desde la lista
// Selectores reales del juego: .chatbox-view-contents > .log .log-contents p, .player-list-item,
// [data-hook="list"] tr, [data-hook="name"], .room-view .container > h1.

export type ExtrasConfig = {
	chatHighlight: boolean;
	mentionSound: boolean;
	msgSound: boolean;
	mentionUrl: string; // sonido propio ("" = el generado)
	msgUrl: string;
	goalUrl: string; // sonido propio que suena al meter un gol (se suma al del juego)
	volume: number; // 0..1
	templates: string[];
	team: string[];
	favAlerts: boolean;
	lastRoom: string;
	lastLink: string; // link de la ultima sala si entraste por link
};

export const EXTRAS_DEFAULTS: ExtrasConfig = {
	chatHighlight: true,
	mentionSound: true,
	msgSound: false,
	mentionUrl: "",
	msgUrl: "",
	goalUrl: "",
	volume: 0.6,
	templates: ["gg", "buena!", "pasala", "defensa!", "ya vuelvo"],
	team: [],
	favAlerts: true,
	lastRoom: "",
	lastLink: "",
};

let cfg: ExtrasConfig = { ...EXTRAS_DEFAULTS };

export const getExtras = (): ExtrasConfig => ({ ...cfg, templates: [...cfg.templates], team: [...cfg.team] });
export const updateExtras = (partial: Partial<ExtrasConfig>): void => {
	cfg = { ...cfg, ...partial };
};

export const readExtras = (prefs: any): ExtrasConfig => {
	const arr = (v: any, d: string[]) => (Array.isArray(v) ? v.map(String) : d);
	const vol = Number(prefs?.x_snd_vol);
	return {
		chatHighlight: prefs?.x_chat_highlight ?? EXTRAS_DEFAULTS.chatHighlight,
		mentionSound: prefs?.x_mention_sound ?? EXTRAS_DEFAULTS.mentionSound,
		msgSound: prefs?.x_msg_sound ?? EXTRAS_DEFAULTS.msgSound,
		mentionUrl: typeof prefs?.x_snd_mention === "string" ? prefs.x_snd_mention : "",
		msgUrl: typeof prefs?.x_snd_msg === "string" ? prefs.x_snd_msg : "",
		goalUrl: typeof prefs?.x_snd_goal === "string" ? prefs.x_snd_goal : "",
		volume: Number.isFinite(vol) ? Math.min(1, Math.max(0, vol)) : EXTRAS_DEFAULTS.volume,
		templates: arr(prefs?.x_templates, EXTRAS_DEFAULTS.templates).slice(0, 9),
		team: arr(prefs?.x_team, []),
		favAlerts: prefs?.x_fav_alerts ?? EXTRAS_DEFAULTS.favAlerts,
		lastRoom: typeof prefs?.x_last_room === "string" ? prefs.x_last_room : "",
		lastLink: typeof prefs?.x_last_link === "string" ? prefs.x_last_link : "",
	};
};

// ---- utilidades ---------------------------------------------------------------

const getDoc = (): Document | null => {
	try {
		const frame = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement | undefined;
		return frame?.contentDocument ?? null;
	} catch {
		return null;
	}
};

const myName = (): string => {
	try { return (localStorage.getItem("player_name") || "").trim(); } catch { return ""; }
};

const toast = (text: string): void => {
	const id = "hax-extras-toast";
	document.getElementById(id)?.remove();
	const n = document.createElement("div");
	n.id = id;
	n.textContent = text;
	n.style.cssText =
		"position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483647;padding:8px 16px;" +
		"border-radius:8px;background:rgba(17,22,25,.92);color:#fff;font:600 13px sans-serif;pointer-events:none;";
	document.body.appendChild(n);
	setTimeout(() => n.remove(), 2600);
};
export const showToast = toast;

let audioCtx: AudioContext | null = null;
const beep = (kind: "mention" | "msg"): void => {
	try {
		audioCtx = audioCtx || new AudioContext();
		const t = audioCtx.currentTime;
		const notes = kind === "mention" ? [880, 1320] : [660];
		notes.forEach((freq, i) => {
			const osc = audioCtx!.createOscillator();
			const gain = audioCtx!.createGain();
			osc.type = "sine";
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0.0001, t + i * 0.11);
			gain.gain.exponentialRampToValueAtTime(Math.max(0.001, cfg.volume * 0.35), t + i * 0.11 + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.11 + 0.18);
			osc.connect(gain).connect(audioCtx!.destination);
			osc.start(t + i * 0.11);
			osc.stop(t + i * 0.11 + 0.2);
		});
	} catch { /* sin audio */ }
};

export const playSound = (kind: "mention" | "msg" | "goal"): void => {
	const url = kind === "mention" ? cfg.mentionUrl : kind === "goal" ? cfg.goalUrl : cfg.msgUrl;
	if (kind === "goal" && !url) return; // el de gol solo suena si cargaste uno
	if (url) {
		try {
			const audio = new Audio(url);
			audio.volume = cfg.volume;
			void audio.play().catch(() => { if (kind !== "goal") beep(kind); });
			return;
		} catch { /* cae al generado */ }
	}
	if (kind !== "goal") beep(kind);
};

// ---- estilos dentro del iframe ------------------------------------------------

const STYLE_ID = "hax-extras-style";
const ensureStyle = (doc: Document): void => {
	if (doc.getElementById(STYLE_ID)) return;
	const style = doc.createElement("style");
	style.id = STYLE_ID;
	style.textContent = `
.log-contents p.hx-mention { background: rgba(208, 184, 120, 0.16) !important; border-left: 3px solid #d0b878; padding-left: 6px; border-radius: 4px; }
.player-list-item.hx-team { box-shadow: inset 3px 0 0 #d0b878; }
`;
	(doc.head || doc.documentElement).appendChild(style);
};

// ---- chat ---------------------------------------------------------------------

export const analyzeMessage = (text: string, me: string): { mention: boolean; mine: boolean; sender: string } => {
	const idx = text.indexOf(":");
	const sender = idx > 0 ? text.slice(0, idx).trim() : "";
	const body = idx > 0 ? text.slice(idx + 1) : text;
	const mine = !!me && sender === me;
	const mention = !!me && !!sender && !mine && body.toLowerCase().includes(me.toLowerCase());
	return { mention, mine, sender };
};

const handleMessage = (p: Element): void => {
	const me = myName();
	if (!me) return;
	const { mention, mine, sender } = analyzeMessage(p.textContent || "", me);
	if (mention) {
		if (cfg.chatHighlight) p.classList.add("hx-mention");
		if (cfg.mentionSound) playSound("mention");
	} else if (cfg.msgSound && sender && !mine) {
		playSound("msg");
	}
};

const watchChat = (doc: Document): void => {
	const log = doc.querySelector(".chatbox-view-contents > .log .log-contents") as (HTMLElement & { __hxObs?: boolean }) | null;
	if (!log || log.__hxObs) return;
	log.__hxObs = true;
	ensureStyle(doc);
	const startedAt = Date.now();
	new MutationObserver((records) => {
		if (Date.now() - startedAt < 700) return; // historial ya cargado
		for (const rec of records) {
			rec.addedNodes.forEach((node) => {
				const n = node as Element;
				if (n.nodeType === 1 && n.tagName === "P") handleMessage(n);
			});
		}
	}).observe(log, { childList: true });
};

// ---- plantillas (Alt+1..9) -----------------------------------------------------

export const sendChat = (text: string): boolean => {
	const doc = getDoc();
	const input = doc?.querySelector(".chatbox-view-contents>.input input[type=text]") as HTMLInputElement | null;
	if (!doc || !input || !text) return false;
	const win = doc.defaultView as any;
	input.value = text;
	input.dispatchEvent(new win.Event("input", { bubbles: true }));
	const opts = { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true };
	input.dispatchEvent(new win.KeyboardEvent("keydown", opts));
	input.dispatchEvent(new win.KeyboardEvent("keyup", opts));
	return true;
};

const onKey = (e: KeyboardEvent): void => {
	if (!e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
	const n = Number(e.key);
	if (!(n >= 1 && n <= 9)) return;
	const text = cfg.templates[n - 1];
	if (!text) return;
	e.preventDefault();
	e.stopPropagation();
	sendChat(text);
};

const hookKeys = (doc: Document): void => {
	const marker = doc as Document & { __hxKeys?: boolean };
	if (marker.__hxKeys) return;
	marker.__hxKeys = true;
	doc.addEventListener("keydown", onKey, true);
};

// ---- equipo --------------------------------------------------------------------

let teamPresent: string[] = [];
export const getTeamPresent = (): string[] => [...teamPresent];

const markTeam = (doc: Document): void => {
	const wanted = cfg.team.map((n) => n.trim().toLowerCase()).filter(Boolean);
	const present: string[] = [];
	doc.querySelectorAll(".player-list-item").forEach((item) => {
		const nameEl = item.querySelector(".name") || item;
		const name = (nameEl.textContent || "").trim();
		const hit = wanted.find((w) => name.toLowerCase() === w || (!item.querySelector(".name") && name.toLowerCase().startsWith(w)));
		item.classList.toggle("hx-team", !!hit);
		if (hit && !present.includes(name)) present.push(name);
	});
	teamPresent = present;
};

// ---- salas favoritas y ultima sala ----------------------------------------------

let prevFavs: Set<string> | null = null;

const notify = (title: string, body: string): void => {
	try {
		if (typeof Notification !== "undefined") new Notification(title, { body, silent: false });
	} catch { /* sin permiso */ }
	toast(`${title}: ${body}`);
};

const checkFavorites = (doc: Document): void => {
	const rows = doc.querySelectorAll('[data-hook="list"] tr');
	if (!rows.length) { prevFavs = null; return; }
	let favs: string[] = [];
	try { favs = JSON.parse(localStorage.getItem("fav_rooms") || "[]"); } catch { /* vacio */ }
	if (!favs.length) return;
	const now = new Map<string, string>();
	rows.forEach((row) => {
		const name = (row.querySelector('[data-hook="name"]')?.textContent || "").trim();
		if (name && favs.includes(name)) now.set(name, (row.querySelector('[data-hook="players"]')?.textContent || "").trim());
	});
	if (prevFavs && cfg.favAlerts) {
		now.forEach((players, name) => {
			if (!prevFavs!.has(name)) notify("Sala favorita disponible", players ? `${name} (${players})` : name);
		});
	}
	prevFavs = new Set(now.keys());
};

export const normalizeRoomLink = (raw: string): string | null => {
	const text = raw.trim();
	if (!text) return null;
	const matchCode = text.match(/[?&]c=([a-zA-Z0-9_-]{5,25})/i);
	if (matchCode) {
		return `https://www.haxball.com/play?c=${matchCode[1]}`;
	}
	if (/^https?:\/\/(www\.|html5\.)?haxball\.com\/play\?c=[a-zA-Z0-9_-]+$/i.test(text)) {
		return text.replace("http://", "https://").replace("html5.haxball.com", "www.haxball.com");
	}
	if (/^[a-zA-Z0-9_-]{8,20}$/.test(text)) {
		return `https://www.haxball.com/play?c=${text}`;
	}
	return null;
};

export const isValidRoomLink = (link: string): boolean => normalizeRoomLink(link) !== null;

// Entra a una sala por su link (recarga la pagina con ese link, como hace HaxBall)
export const joinRoomLink = (link: string): boolean => {
	const clean = normalizeRoomLink(link);
	if (!clean) return false;
	window.location.href = clean;
	return true;
};

export const rejoinLastRoom = (): string => {
	const doc = getDoc();
	const name = cfg.lastRoom;
	// 1) si la lista de salas esta abierta y la sala esta ahi, entra desde la lista
	const rows = Array.from(doc?.querySelectorAll('[data-hook="list"] tr') || []);
	const row = name
		? (rows.find((r) => (r.querySelector('[data-hook="name"]')?.textContent || "").trim() === name) as HTMLElement | undefined)
		: undefined;
	if (row && doc) {
		const win = doc.defaultView as any;
		row.click();
		row.dispatchEvent(new win.MouseEvent("dblclick", { bubbles: true, cancelable: true }));
		(doc.querySelector('[data-hook="join"]') as HTMLElement | null)?.click();
		return `Entrando a "${name}"...`;
	}
	// 2) si habias entrado por link, vuelve por ese link
	if (cfg.lastLink && joinRoomLink(cfg.lastLink)) return "Volviendo a la ultima sala...";
	if (!name && !cfg.lastLink) return "Todavia no hay una ultima sala guardada.";
	return rows.length ? `No veo "${name}" en la lista (toca Refresh).` : "Abri la lista de salas y toca de nuevo.";
};

let firstRoomSinceLoad = true;
const trackLastRoom = (doc: Document, save: (name: string, link: string) => void): void => {
	const title = doc.querySelector(".room-view .container > h1, .room-view h1");
	const name = (title?.textContent || "").trim();
	if (!name) return;
	// La primera sala desde que cargo la pagina es la del link (si la pagina se abrio con ?c=)
	const link = firstRoomSinceLoad && /[?&]c=/.test(window.location.search) && isValidRoomLink(window.location.href) ? window.location.href : "";
	if (name !== cfg.lastRoom) {
		cfg.lastRoom = name;
		cfg.lastLink = link; // si entraste por la lista, el link viejo ya no vale
		firstRoomSinceLoad = false;
		save(name, link);
	} else if (firstRoomSinceLoad) {
		firstRoomSinceLoad = false;
		if (link && cfg.lastLink !== link) {
			cfg.lastLink = link;
			save(name, link);
		}
	}
};

// ---- arranque -------------------------------------------------------------------

export const startExtras = async (): Promise<void> => {
	try {
		cfg = readExtras(await window.electronAPI.getAppPreferences());
	} catch { /* valores por defecto */ }

	hookKeys(document);
	setInterval(() => {
		const doc = getDoc();
		if (!doc?.body) return;
		try {
			hookKeys(doc);
			watchChat(doc);
			markTeam(doc);
			trackLastRoom(doc, (n, link) => {
				window.electronAPI.setAppPreference("x_last_room", n);
				window.electronAPI.setAppPreference("x_last_link", link);
			});
		} catch { /* iframe cambiando */ }
	}, 1000);
	setInterval(() => {
		const doc = getDoc();
		if (!doc?.body) return;
		try { checkFavorites(doc); } catch { /* sin acceso */ }
	}, 5000);
};
