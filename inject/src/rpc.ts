// rpc.ts
// Presencia de Discord con datos de la sala: nombre de la sala y cantidad de jugadores.
// Lee el DOM del iframe del juego (solo textos de estructura, nada de chat) cada 15 s.

let lastRoom = "";

const read = (): { room: string; players: number; inRoom: boolean } | null => {
	try {
		const frame = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement | undefined;
		const doc = frame?.contentDocument;
		if (!doc?.body) return null;
		const title = doc.querySelector(".room-view .container > h1, .room-view h1");
		const name = (title?.textContent || "").trim();
		if (name) lastRoom = name;
		const inRoom = !!doc.querySelector(".game-view, .room-view") && !doc.querySelector(".roomlist-view");
		const players = doc.querySelectorAll(".room-view .player-list-item").length;
		return { room: lastRoom, players, inRoom };
	} catch {
		return null;
	}
};

const tick = (): void => {
	const info = read();
	if (!info || !info.inRoom) {
		if (info) lastRoom = "";
		return;
	}
	const details = info.room ? `Sala: ${info.room}`.slice(0, 120) : "Jugando en una sala";
	const state = info.players > 0 ? `${info.players} jugadores en la sala` : "En partida";
	window.electronAPI.updateDiscordRPC(details, state);
};

export const startDiscordPresence = (): void => {
	setInterval(tick, 15000);
};
