import { autoUpdater } from "./autoUpdater"
import { injectFavoriteRoomsButtons } from "./favrooms";
import { addTranspUIButton, setGameView, toggleTransparentUI } from "./gameview";
import { toggleHeaderVisibility } from "./ui/setupCustomHeader";

const ROOM_GAME_TOGGLE_CLASS = "hx-room-game-toggle";
const NATIVE_GAME_CONTROL_CLASS = "hx-native-game-control";

const markTeamActions = (): void => {
	const room = document.querySelector<HTMLElement>(".room-view > .container");
	if (!room) return;

	const actionButtons = Array.from(room.querySelectorAll<HTMLButtonElement>("button"))
		.filter((button) => /\b(auto|rand|lock|reset)\b/i.test(button.textContent ?? ""));
	const actionNames = new Set(actionButtons.map((button) =>
		(button.textContent ?? "").match(/\b(auto|rand|lock|reset)\b/i)?.[1].toLowerCase()
	));
	if (actionNames.size !== 4 || actionButtons.length < 4) return;

	let actionGroup = actionButtons[0].parentElement;
	while (actionGroup && actionGroup !== room && !actionButtons.every((button) => actionGroup?.contains(button))) {
		actionGroup = actionGroup.parentElement;
	}
	if (actionGroup && actionGroup !== room) actionGroup.classList.add("hx-team-actions");
};

const getNativeGameButtons = (controls: HTMLElement): { start: HTMLButtonElement | undefined; stop: HTMLButtonElement | undefined } => {
	const buttons = Array.from(controls.querySelectorAll<HTMLButtonElement>("button"))
		.filter((button) => !button.classList.contains(ROOM_GAME_TOGGLE_CLASS));
	const start = buttons.find((button) => {
		const label = button.textContent?.trim().toLowerCase() ?? "";
		return button.dataset.hook === "start" || button.classList.contains("green") || /\bstart\b|\biniciar\b/.test(label);
	});
	const stop = buttons.find((button) => {
		const label = button.textContent?.trim().toLowerCase() ?? "";
		return button.dataset.hook === "stop" || button.classList.contains("red") || /\bstop\b|\bdetener\b/.test(label);
	});

	return { start, stop };
};

const installRoomGameToggle = (): void => {
	markTeamActions();
	const controls = document.querySelector<HTMLElement>(".room-view .controls");
	if (!controls) return;

	const { start, stop } = getNativeGameButtons(controls);
	if (!start || !stop) {
		console.error("Unable to find the native start and stop game buttons.");
		return;
	}

	start.classList.add(NATIVE_GAME_CONTROL_CLASS);
	stop.classList.add(NATIVE_GAME_CONTROL_CLASS);

	let toggle = controls.querySelector<HTMLButtonElement>(`.${ROOM_GAME_TOGGLE_CLASS}`);
	if (!toggle) {
		toggle = document.createElement("button");
		toggle.type = "button";
		toggle.className = ROOM_GAME_TOGGLE_CLASS;
		toggle.addEventListener("click", () => {
			const nativeButtons = getNativeGameButtons(controls);
			const gameRunning = Boolean(document.querySelector(".game-view"));
			const action = gameRunning ? nativeButtons.stop : nativeButtons.start;
			if (!action) {
				console.error(`Unable to find the native ${gameRunning ? "stop" : "start"} game button.`);
				return;
			}
			action.click();
		});
		controls.appendChild(toggle);
	}

	const pause = Array.from(controls.querySelectorAll<HTMLButtonElement>("button"))
		.find((button) => button !== toggle && /\bpause\b|\bpausar\b/i.test(button.textContent ?? ""));
	if (pause && toggle.nextElementSibling !== pause) {
		controls.insertBefore(toggle, pause);
	}

	const gameRunning = Boolean(document.querySelector(".game-view"));
	const label = gameRunning ? "Stop game" : "Start game";
	if (toggle.textContent !== label) toggle.textContent = label;
	if (toggle.getAttribute("aria-label") !== label) toggle.setAttribute("aria-label", label);
	toggle.classList.toggle("green", !gameRunning);
	toggle.classList.toggle("red", gameRunning);
};

let roomGameToggleObserver: MutationObserver | undefined;

const observeRoomGameState = (): void => {
	if (roomGameToggleObserver) return;

	roomGameToggleObserver = new MutationObserver(() => installRoomGameToggle());
	roomGameToggleObserver.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
		subtree: true,
	});
};

export const handleGameView = (viewName: string): void => {
	switch(true) {
		case viewName === "dropdown":
			if (localStorage.getItem("header_visible") === "false"){
				toggleHeaderVisibility();
			}
			window.electronAPI.updateDiscordRPC("TL App", "Eligiendo sala")
			autoUpdater();
			break;
		// when a room is entered
		case [
			"game-view", 
			"game-view showing-room-view chat-bg-full", 
			"game-view showing-room-view"
		].includes(viewName):
			installRoomGameToggle();
			observeRoomGameState();
			if (localStorage.getItem("header_visible") === "true"){
				toggleHeaderVisibility();
			}
			window.electronAPI.updateDiscordRPC("TL App", "Jugando en una sala")
			setGameView();
			break;
		case viewName === "room-view":
			installRoomGameToggle();
			observeRoomGameState();
			if (localStorage.getItem("header_visible") === "true"){
				toggleHeaderVisibility();
			}
			addTranspUIButton();
			toggleTransparentUI();
			break;
		case viewName === "roomlist-view":
			injectFavoriteRoomsButtons();
			break;
	}
}