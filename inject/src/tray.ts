// tray.ts
// Pestaña fija arriba, al centro: "Apreta para bajar". Al apretarla baja una bandeja con
//  * un campo para pegar el link de una sala (y un boton "Pegar y entrar")
//  * un boton "Volver a la ultima sala"
// Vuelve a subir con el mismo boton. Dentro de una sala la pestaña queda mas discreta.

import { getExtras, isValidRoomLink, joinRoomLink, rejoinLastRoom, showToast } from "./extras";

const ROOT_ID = "hax-tray-root";
let open = false;

const CSS = `
#${ROOT_ID} { position: fixed; top: 0; left: 50%; transform: translateX(-50%); z-index: 2147482500; font-family: Inter, "Segoe UI", system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; pointer-events: none; }
#${ROOT_ID} > * { pointer-events: auto; }
#${ROOT_ID} .tr-tab { display: flex; align-items: center; gap: 8px; margin-top: 6px; padding: 5px 16px; border-radius: 999px; cursor: pointer; user-select: none;
	font: 600 12px Inter, "Segoe UI", sans-serif; letter-spacing: .04em; color: #eef2fa; background: linear-gradient(180deg, #1b3158, #0e1a31);
	border: 1px solid rgba(208,184,120,.45); box-shadow: 0 4px 16px rgba(0,0,0,.4); transition: opacity .2s ease, transform .2s ease; }
#${ROOT_ID} .tr-tab:hover { border-color: #d0b878; box-shadow: 0 4px 20px rgba(208,184,120,.25); }
#${ROOT_ID} .tr-tab svg { width: 14px; height: 14px; stroke: #d0b878; fill: none; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; transition: transform .25s ease; }
#${ROOT_ID}.tr-open .tr-tab svg { transform: rotate(180deg); }
#${ROOT_ID}.tr-ingame:not(.tr-open) .tr-tab { opacity: .28; }
#${ROOT_ID}.tr-ingame:not(.tr-open) .tr-tab:hover { opacity: 1; }
#${ROOT_ID} .tr-card { width: min(560px, 92vw); margin-top: 8px; padding: 14px; border-radius: 16px; box-sizing: border-box;
	background: rgba(13,24,46,.94); border: 1px solid rgba(208,184,120,.35); box-shadow: 0 18px 50px rgba(0,0,0,.55);
	display: flex; flex-direction: column; gap: 10px; transform-origin: top center; transform: translateY(-14px) scaleY(.92); opacity: 0; visibility: hidden;
	transition: transform .22s ease, opacity .2s ease, visibility 0s linear .22s; }
#${ROOT_ID}.tr-open .tr-card { transform: none; opacity: 1; visibility: visible; transition-delay: 0s; }
#${ROOT_ID} .tr-row { display: flex; gap: 8px; }
#${ROOT_ID} input { flex: 1; min-width: 0; padding: 9px 14px; font-size: 14px; color: #fff; background: rgba(8,16,31,.7); border: 1px solid rgba(208,184,120,.28); border-radius: 999px; outline: none; font-family: inherit; }
#${ROOT_ID} input:focus { border-color: #d0b878; box-shadow: 0 0 0 2px rgba(208,184,120,.25); }
#${ROOT_ID} input.tr-bad { border-color: #ff6e6e; animation: hxtr-shake .3s ease; }
@keyframes hxtr-shake { 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
#${ROOT_ID} button { padding: 9px 16px; font: 700 13px Inter, "Segoe UI", sans-serif; border-radius: 999px; cursor: pointer; border: 1px solid rgba(208,184,120,.45); color: #14213a;
	background: linear-gradient(180deg, #e2c987, #c2a35e); white-space: nowrap; }
#${ROOT_ID} button:hover { filter: brightness(1.08); }
#${ROOT_ID} button.tr-ghost { color: #eef2fa; background: rgba(255,255,255,.06); }
#${ROOT_ID} .tr-msg { min-height: 16px; font-size: 12px; color: #aab6cc; text-align: center; }
`;

const place = (root: HTMLElement): void => {
	root.style.top = "0px"; // la pestaña va dentro de la franja de la cabecera (que ya no tiene botones al centro)
	const inGame = localStorage.getItem("header_visible") === "false";
	root.classList.toggle("tr-ingame", inGame);
};

export const startTray = (): void => {
	if (document.getElementById(ROOT_ID)) return;
	const style = document.createElement("style");
	style.textContent = CSS;
	document.head.appendChild(style);

	const root = document.createElement("div");
	root.id = ROOT_ID;

	const tab = document.createElement("div");
	tab.className = "tr-tab";
	const label = document.createElement("span");
	label.textContent = "Apreta para bajar";
	tab.innerHTML = '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>';
	tab.appendChild(label);

	const card = document.createElement("div");
	card.className = "tr-card";
	const row = document.createElement("div");
	row.className = "tr-row";
	const input = document.createElement("input");
	input.type = "text";
	input.placeholder = "Pega el link de la sala (https://www.haxball.com/play?c=...)";
	input.addEventListener("keydown", (e) => {
		e.stopPropagation(); // las teclas no deben llegar al juego
		if (e.key === "Enter") go(input.value);
	});
	input.addEventListener("keyup", (e) => e.stopPropagation());
	const enter = document.createElement("button");
	enter.textContent = "Entrar";
	row.append(input, enter);

	const row2 = document.createElement("div");
	row2.className = "tr-row";
	const paste = document.createElement("button");
	paste.className = "tr-ghost";
	paste.textContent = "Pegar y entrar";
	paste.style.flex = "1";
	const last = document.createElement("button");
	last.style.flex = "1";
	row2.append(paste, last);

	const msg = document.createElement("div");
	msg.className = "tr-msg";
	card.append(row, row2, msg);
	root.append(tab, card);
	document.body.appendChild(root);

	const refreshLast = () => {
		const name = getExtras().lastRoom;
		last.textContent = name ? `Volver a la ultima sala · ${name.length > 24 ? name.slice(0, 23) + "…" : name}` : "Volver a la ultima sala";
	};

	const setOpen = (value: boolean) => {
		open = value;
		root.classList.toggle("tr-open", open);
		label.textContent = open ? "Subir" : "Apreta para bajar";
		if (open) {
			refreshLast();
			place(root);
			setTimeout(() => input.focus(), 120);
		} else {
			input.blur();
			msg.textContent = "";
		}
	};

	const go = (link: string) => {
		if (isValidRoomLink(link)) {
			msg.textContent = "Entrando a la sala...";
			input.value = "";
			setTimeout(() => joinRoomLink(link), 400);
		} else {
			input.classList.remove("tr-bad");
			void input.offsetWidth;
			input.classList.add("tr-bad");
			msg.textContent = "Ese link no parece valido (https://www.haxball.com/play?c=...)";
		}
	};

	tab.addEventListener("click", () => setOpen(!open));
	enter.addEventListener("click", () => go(input.value));
	paste.addEventListener("click", async () => {
		try {
			const text = (await navigator.clipboard.readText()).trim();
			input.value = text;
			go(text);
		} catch {
			msg.textContent = "No pude leer el portapapeles: pegalo en el campo (Ctrl+V).";
			input.focus();
		}
	});
	last.addEventListener("click", () => {
		const result = rejoinLastRoom();
		msg.textContent = result;
		showToast(result);
	});

	(window as any).__haxToggleTray = () => setOpen(!open);
	setInterval(() => place(root), 700);
	place(root);
};
