import { autoUpdater } from "./autoUpdater"
import { injectFavoriteRoomsButtons } from "./favrooms";
import { addTranspUIButton, setGameView, toggleTransparentUI } from "./gameview";
import { toggleHeaderVisibility } from "./ui/setupCustomHeader";

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
			if (localStorage.getItem("header_visible") === "true"){
				toggleHeaderVisibility();
			}
			window.electronAPI.updateDiscordRPC("TL App", "Jugando en una sala")
			setGameView();
			break;
		case viewName === "room-view":
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