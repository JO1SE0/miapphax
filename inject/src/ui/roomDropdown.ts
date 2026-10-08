// roomDropdown.ts
// Barra desplegable superior para pegar link de salas y volver a la última sala

import { rejoinLastRoom, showToast, getExtras } from "../extras";

const STORAGE_LAST_URL = "hax_last_room_url";
const STORAGE_LAST_NAME = "hax_last_room_name";

/**
 * Normaliza cualquier formato de link o código de sala de Haxball
 */
function normalizeRoomLink(raw: string): string | null {
	const text = raw.trim();
	if (!text) return null;

	// Si tiene el parámetro ?c= o &c=
	const matchCode = text.match(/[?&]c=([a-zA-Z0-9_-]{5,25})/i);
	if (matchCode) {
		return `https://www.haxball.com/play?c=${matchCode[1]}`;
	}

	// Si es una URL directa a haxball.com
	if (/^https?:\/\/(www\.|html5\.)?haxball\.com\/play\?c=[a-zA-Z0-9_-]+/i.test(text)) {
		return text.replace("http://", "https://").replace("html5.haxball.com", "www.haxball.com");
	}

	// Si pegó sólo el código alfanumérico (ej: abc123def45)
	if (/^[a-zA-Z0-9_-]{8,20}$/.test(text)) {
		return `https://www.haxball.com/play?c=${text}`;
	}

	return null;
}

export const setupRoomDropdown = (): void => {
	// Evitar inyecciones duplicadas
	if (document.getElementById("hax-dropdown-container")) return;

	// Inyectar estilos CSS
	const style = document.createElement("style");
	style.id = "hax-dropdown-styles";
	style.textContent = `
		#hax-dropdown-container {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			z-index: 999999;
			pointer-events: none;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
			user-select: none;
		}

		/* Panel desplegable que baja */
		#hax-dropdown-panel {
			position: relative;
			width: 100%;
			box-sizing: border-box;
			background: linear-gradient(180deg, rgba(10, 19, 35, 0.98) 0%, rgba(6, 12, 22, 0.96) 100%);
			border-bottom: 2px solid #d0b878;
			box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(208, 184, 120, 0.2);
			backdrop-filter: blur(10px);
			padding: 12px 24px;
			transform: translateY(-100%);
			transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
			pointer-events: auto;
		}

		#hax-dropdown-panel.open {
			transform: translateY(0);
		}

		.hax-panel-content {
			max-width: 960px;
			margin: 0 auto;
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 16px;
			flex-wrap: wrap;
		}

		.hax-input-group {
			display: flex;
			align-items: center;
			gap: 8px;
			flex: 1;
			min-width: 320px;
		}

		#hax-room-input {
			flex: 1;
			height: 38px;
			background: rgba(18, 30, 52, 0.85);
			border: 1px solid rgba(208, 184, 120, 0.4);
			border-radius: 8px;
			padding: 0 12px;
			color: #ffffff;
			font-size: 14px;
			outline: none;
			transition: border-color 0.2s, box-shadow 0.2s;
		}

		#hax-room-input::placeholder {
			color: rgba(255, 255, 255, 0.45);
		}

		#hax-room-input:focus {
			border-color: #d0b878;
			box-shadow: 0 0 10px rgba(208, 184, 120, 0.4);
		}

		.hax-btn {
			height: 38px;
			padding: 0 16px;
			border: none;
			border-radius: 8px;
			font-size: 13px;
			font-weight: 700;
			cursor: pointer;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 6px;
			transition: all 0.2s ease;
			white-space: nowrap;
		}

		.hax-btn-paste {
			background: #203a5e;
			color: #e6edf3;
			border: 1px solid rgba(255, 255, 255, 0.15);
		}

		.hax-btn-paste:hover {
			background: #2b4e7e;
			color: #ffffff;
			transform: translateY(-1px);
		}

		.hax-btn-enter {
			background: linear-gradient(135deg, #d0b878 0%, #a89050 100%);
			color: #0c1524;
			box-shadow: 0 2px 8px rgba(208, 184, 120, 0.3);
		}

		.hax-btn-enter:hover {
			background: linear-gradient(135deg, #dfc888 0%, #bca460 100%);
			box-shadow: 0 4px 12px rgba(208, 184, 120, 0.5);
			transform: translateY(-1px);
		}

		.hax-divider {
			width: 1px;
			height: 32px;
			background: rgba(208, 184, 120, 0.3);
		}

		.hax-btn-last {
			background: linear-gradient(135deg, #244967 0%, #173147 100%);
			color: #ffffff;
			border: 1px solid rgba(208, 184, 120, 0.4);
		}

		.hax-btn-last:hover {
			background: linear-gradient(135deg, #305f87 0%, #1f415e 100%);
			border-color: #d0b878;
			box-shadow: 0 0 10px rgba(208, 184, 120, 0.3);
			transform: translateY(-1px);
		}

		/* Botón superior que activa el bajar/subir */
		#hax-dropdown-toggle {
			pointer-events: auto;
			position: absolute;
			left: 50%;
			top: 100%;
			transform: translateX(-50%);
			background: linear-gradient(180deg, #12213a 0%, #0c1728 100%);
			color: #e6edf3;
			border: 1px solid #d0b878;
			border-top: none;
			border-radius: 0 0 12px 12px;
			padding: 6px 20px;
			font-size: 13px;
			font-weight: 700;
			letter-spacing: 0.3px;
			cursor: pointer;
			display: flex;
			align-items: center;
			gap: 8px;
			box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5), 0 0 8px rgba(208, 184, 120, 0.25);
			transition: all 0.22s ease;
		}

		#hax-dropdown-toggle:hover {
			background: linear-gradient(180deg, #1b3054 0%, #12213a 100%);
			color: #ffd978;
			border-color: #ffd978;
			box-shadow: 0 8px 20px rgba(0, 0, 0, 0.65), 0 0 12px rgba(208, 184, 120, 0.45);
			transform: translateX(-50%) translateY(2px);
		}

		@keyframes haxShake {
			0%, 100% { transform: translateX(0); }
			20%, 60% { transform: translateX(-6px); }
			40%, 80% { transform: translateX(6px); }
		}

		.hax-shake {
			animation: haxShake 0.35s ease;
			border-color: #ff5555 !important;
			box-shadow: 0 0 12px rgba(255, 85, 85, 0.6) !important;
		}
	`;
	document.head.appendChild(style);

	// Crear estructura del contenedor
	const container = document.createElement("div");
	container.id = "hax-dropdown-container";

	const panel = document.createElement("div");
	panel.id = "hax-dropdown-panel";

	const content = document.createElement("div");
	content.className = "hax-panel-content";

	// Grupo del input de sala
	const inputGroup = document.createElement("div");
	inputGroup.className = "hax-input-group";

	const input = document.createElement("input");
	input.type = "text";
	input.id = "hax-room-input";
	input.placeholder = "Pega el link de la sala acá...";
	input.autocomplete = "off";

	// Botón Pegar desde portapapeles
	const pasteBtn = document.createElement("button");
	pasteBtn.className = "hax-btn hax-btn-paste";
	pasteBtn.type = "button";
	pasteBtn.innerHTML = `📋 Pegar`;
	pasteBtn.title = "Pegar link desde el portapapeles";

	// Botón Entrar
	const enterBtn = document.createElement("button");
	enterBtn.className = "hax-btn hax-btn-enter";
	enterBtn.type = "button";
	enterBtn.innerHTML = `🚀 Entrar a la sala`;

	inputGroup.appendChild(input);
	inputGroup.appendChild(pasteBtn);
	inputGroup.appendChild(enterBtn);

	// Separador visual
	const divider = document.createElement("div");
	divider.className = "hax-divider";

	// Botón Volver a la última sala
	const lastRoomBtn = document.createElement("button");
	lastRoomBtn.className = "hax-btn hax-btn-last";
	lastRoomBtn.type = "button";
	lastRoomBtn.innerHTML = `↩ Volver a la última sala`;
	lastRoomBtn.id = "hax-last-room-btn";

	content.appendChild(inputGroup);
	content.appendChild(divider);
	content.appendChild(lastRoomBtn);
	panel.appendChild(content);

	// Botón "Apretá para bajar"
	const toggleBtn = document.createElement("button");
	toggleBtn.id = "hax-dropdown-toggle";
	toggleBtn.type = "button";
	toggleBtn.innerHTML = `▼ Apreta para bajar`;

	panel.appendChild(toggleBtn);
	container.appendChild(panel);
	document.body.appendChild(container);

	// Estado abierto / cerrado
	let isOpen = false;

	const updateLastRoomLabel = () => {
		const lastUrl = localStorage.getItem(STORAGE_LAST_URL) || "";
		const lastName = localStorage.getItem(STORAGE_LAST_NAME) || getExtras().lastRoom || "";
		if (lastName) {
			const shortName = lastName.length > 18 ? lastName.substring(0, 18) + "..." : lastName;
			lastRoomBtn.innerHTML = `↩ Volver a: <b>${shortName}</b>`;
			lastRoomBtn.title = `Volver a la última sala: ${lastName}`;
		} else if (lastUrl) {
			lastRoomBtn.innerHTML = `↩ Volver a la última sala`;
			lastRoomBtn.title = `Volver a: ${lastUrl}`;
		} else {
			lastRoomBtn.innerHTML = `↩ Volver a la última sala`;
			lastRoomBtn.title = "Todavía no hay una última sala guardada";
		}
	};

	const setOpen = (open: boolean) => {
		isOpen = open;
		if (isOpen) {
			panel.classList.add("open");
			toggleBtn.innerHTML = `▲ Apreta para subir`;
			updateLastRoomLabel();
			setTimeout(() => input.focus(), 150);
		} else {
			panel.classList.remove("open");
			toggleBtn.innerHTML = `▼ Apreta para bajar`;
			input.blur();
		}
	};

	// Evento de click para bajar o subir
	toggleBtn.addEventListener("click", () => {
		setOpen(!isOpen);
	});

	// Cerrar con Escape
	window.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && isOpen) {
			setOpen(false);
		}
	});

	// Función para ejecutar la entrada a la sala
	const executeJoin = (raw: string) => {
		const validUrl = normalizeRoomLink(raw);
		if (!validUrl) {
			input.classList.add("hax-shake");
			setTimeout(() => input.classList.remove("hax-shake"), 400);
			showToast("⚠️ Link de sala inválido. Pega un link de HaxBall.");
			return;
		}

		// Guardar esta URL como última sala
		localStorage.setItem(STORAGE_LAST_URL, validUrl);
		showToast("Conectando a la sala...");
		setOpen(false);

		setTimeout(() => {
			window.location.href = validUrl;
		}, 250);
	};

	// Click en Entrar
	enterBtn.addEventListener("click", () => {
		executeJoin(input.value);
	});

	// Enter en el Input
	input.addEventListener("keydown", (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			executeJoin(input.value);
		}
	});

	// Click en Pegar
	pasteBtn.addEventListener("click", async () => {
		try {
			let text = "";
			if (navigator.clipboard && (navigator.clipboard as any).readText) {
				text = await (navigator.clipboard as any).readText();
			}
			if (text) {
				input.value = text.trim();
				showToast("📋 Link pegado del portapapeles");
				input.focus();
			} else {
				showToast("Portapapeles vacío");
				input.focus();
			}
		} catch (err) {
			// Si el permiso falla, hacer focus para que pegue con Ctrl+V
			input.focus();
			showToast("Usa Ctrl+V para pegar");
		}
	});

	// Click en Volver a la última sala
	lastRoomBtn.addEventListener("click", () => {
		const lastUrl = localStorage.getItem(STORAGE_LAST_URL);
		const lastName = localStorage.getItem(STORAGE_LAST_NAME) || getExtras().lastRoom;

		if (lastUrl) {
			showToast(`Entrando a la última sala...`);
			setOpen(false);
			setTimeout(() => {
				window.location.href = lastUrl;
			}, 300);
			return;
		}

		if (lastName) {
			const msg = rejoinLastRoom();
			showToast(msg);
			setOpen(false);
			return;
		}

		showToast("Aún no entraste a ninguna sala para volver.");
	});

	// Rastreador periódico para guardar automáticamente la última sala que juega
	setInterval(() => {
		try {
			// Si la URL actual es una sala directa con ?c=
			if (window.location.href.includes("play?c=")) {
				const current = window.location.href;
				if (current !== localStorage.getItem(STORAGE_LAST_URL)) {
					localStorage.setItem(STORAGE_LAST_URL, current);
				}
			}

			// Si estamos dentro del iframe y hay nombre de sala
			const frame = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement | undefined;
			const doc = frame?.contentDocument;
			if (doc) {
				const titleEl = doc.querySelector(".room-view .container > h1, .room-view h1");
				const name = (titleEl?.textContent || "").trim();
				if (name && name !== localStorage.getItem(STORAGE_LAST_NAME)) {
					localStorage.setItem(STORAGE_LAST_NAME, name);
				}
			}
		} catch {
			// Ignorar cross-origin temporal si recarga
		}
	}, 1500);

	updateLastRoomLabel();
};
