import { waitForElement } from "./waitForElement";
import { emojiShortcuts } from "./emojis";
const LOW_LATENCY_STYLE_ID = "hax-low-latency-style";

const applyLowLatencyVisuals = async (
	gameframe: HTMLIFrameElement
): Promise<void> => {
	const doc = gameframe.contentDocument;

	if (!doc) {
		return;
	}

	const prefs = await window.electronAPI.getAppPreferences();
	const enabled = prefs["low_latency"] !== false;

	const existingStyle = doc.getElementById(LOW_LATENCY_STYLE_ID);

	if (!enabled) {
		existingStyle?.remove();
		return;
	}

	if (existingStyle) {
		return;
	}

	const style = doc.createElement("style");
	style.id = LOW_LATENCY_STYLE_ID;

	style.textContent = `
		*,
		*::before,
		*::after {
			transition: none !important;
			animation: none !important;
		}

		.container {
			box-shadow: none !important;
			filter: none !important;
		}

		/* Capa GPU dedicada y optimización de renderizado para el canvas del juego */
		canvas {
			image-rendering: -webkit-optimize-contrast !important;
			transform: translateZ(0) !important;
			will-change: transform !important;
			backface-visibility: hidden !important;
		}

		/* Contención de layout y repintado para evitar relayout global en cada frame */
		.game-view {
			contain: layout paint !important;
		}
	`;

	doc.head.appendChild(style);
};

const addShortcutListener = async (gameframe: HTMLIFrameElement): Promise<void> => {
	const chatInput = gameframe.contentDocument?.querySelector('[data-hook="input"]') as HTMLInputElement;

	if (!chatInput) {
		return;
	}

	if (chatInput.dataset.haxShortcutsBound === "true") {
		return;
	}

	chatInput.dataset.haxShortcutsBound = "true";
	const prefs = await window.electronAPI.getAppPreferences();
	const shortcutTuples: [string, string][] = prefs["shortcuts"];
	const shortcutMap = new Map(shortcutTuples);

	const emojiRegex = /:[a-zA-Z0-9_]+:/g;

	chatInput.addEventListener("keyup", () => {
		let text = chatInput.value;

		// Expand shortcut only if the entire input matches
		if (shortcutMap.has(text)) {
			text = shortcutMap.get(text)!;
		}

		// Replace all matching emoji patterns
		text = text.replace(emojiRegex, match => emojiShortcuts[match] || match);

		chatInput.value = text;
	});
};

export const toggleTransparentUI = async (): Promise<void> => {
    const gameframe = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement;
	if (!gameframe?.contentDocument) {
		new Error("Gameframe or contentDocument not found");
		return;
	}

    const prefs = await window.electronAPI.getAppPreferences();
    const enable = prefs["transp_ui"];
    const gameView = gameframe.contentDocument.getElementsByClassName("game-view")[0] as HTMLElement | null;
    const bar = gameframe.contentDocument.getElementsByClassName("bar")[0] as HTMLElement | null;
    const chatInput = gameframe.contentDocument.querySelector(".chatbox-view-contents>.input input[type=text]") as HTMLInputElement | null;
    const container = gameframe.contentDocument.getElementsByClassName("container")[0] as HTMLElement | null;

    if (enable) {
        // gameframe.contentDocument.getElementsByClassName("game-view chat-bg-full")[0].style.cssText = "--chat-opacity: 0.063;"
        if (gameView) {
            gameView.style.cssText = "--chat-opacity: 0.063;";
        }
        if (chatInput) {
            chatInput.style.backgroundColor = "rgba(26, 33, 37, 0.063)";
        }
        if (bar) {
            bar.style.background = "rgba(26, 33, 37, 0.063)";
        }

        const buttonsContainer = gameframe.contentDocument.querySelector(".game-view > .buttons") as HTMLElement | null;
        if (buttonsContainer) {
            Array.from(buttonsContainer.children).forEach((button) => {
                (button as HTMLElement).style.background = "rgba(26, 33, 37, 0.063)";
            });
        }

        const soundButtonContainer = gameframe.contentDocument.getElementsByClassName("sound-button-container")[0] as HTMLElement | undefined;
        if (soundButtonContainer) {
            Array.from(soundButtonContainer.children).forEach((child) => {
                (child as HTMLElement).style.background = "rgba(26, 33, 37, 0.063)";
            });
        }

        gameframe.contentDocument.querySelectorAll(".dialog button, .room-view>.container button").forEach((button) => {
            (button as HTMLElement).style.background = "rgba(26, 33, 37, 0.063)";
        });
        gameframe.contentDocument.querySelectorAll(".top-section  > .room-view > .container > .teams > .player-list-view").forEach((list) => {
            const playerList = list.childNodes[1] as HTMLElement | undefined;
            if (playerList) {
                playerList.style.background = "rgba(26, 33, 37, 0.063)";
            }
        });
        gameframe.contentDocument.querySelectorAll(".dialog select, .room-view>.container select").forEach((select) => {
            (select as HTMLElement).style.background = "rgba(26, 33, 37, 0.063)";
            (select as HTMLElement).style.border = "0px";
        });

        if (container) {
            container.style.background = "rgba(26, 33, 37, 0.1)";
            container.style.border = "1px solid rgba(255, 255, 255, 0.25)";
            container.style.borderRadius = "8px";
            container.style.boxShadow = `
                inset 0 0 2px rgba(255, 255, 255, 0.35),  /* stronger inner glow */
                0 0 0 1px rgba(255, 255, 255, 0.1),       /* crisper outer outline */
                0 0 6px rgba(255, 255, 255, 0.08)         /* subtle surrounding shimmer */
            `;
        }

        // add shadow to chat messages
        // gameframe.contentDocument.querySelectorAll('.chatbox-view-contents > .log .log-contents p').forEach(p => { p.style.textShadow = "1px 1px 1px #000, 0px 1px 1px #000;"})
    } else {
        const normalChatOpacity = Number(
	prefs["chat_opacity"] ??
	localStorage.getItem("chat_opacity") ??
	0.8
);
        if (gameView) {
            gameView.style.cssText = `--chat-opacity: ${normalChatOpacity}`;
        }
        if (chatInput) {
            chatInput.style.backgroundColor = "#111619";
        }
        if (bar) {
            bar.style.background = "";
        }

        const buttonsContainer = gameframe.contentDocument.querySelector(".game-view > .buttons") as HTMLElement | null;
        if (buttonsContainer) {
            Array.from(buttonsContainer.children).forEach((button) => {
                (button as HTMLElement).style.background = "";
            });
        }

        const soundButtonContainer = gameframe.contentDocument.getElementsByClassName("sound-button-container")[0] as HTMLElement | undefined;
        if (soundButtonContainer) {
            Array.from(soundButtonContainer.children).forEach((child) => {
                (child as HTMLElement).style.background = "";
            });
        }

        gameframe.contentDocument.querySelectorAll(".dialog button, .room-view>.container button").forEach((button) => {
            (button as HTMLElement).style.background = "";
        });
        gameframe.contentDocument.querySelectorAll(".top-section  > .room-view > .container > .teams > .player-list-view").forEach((list) => {
            const playerList = list.childNodes[1] as HTMLElement | undefined;
            if (playerList) {
                playerList.style.background = "";
            }
        });
        gameframe.contentDocument.querySelectorAll(".dialog select, .room-view>.container select").forEach((select) => {
            (select as HTMLElement).style.background = "";
            (select as HTMLElement).style.border = "1px solid #111619";
        });

        if (container) {
            container.style.background = "";
            container.style.border = "";
            container.style.borderRadius = "";
            container.style.boxShadow = "";
            container.style.filter = "";
        }

        // gameframe.contentDocument.querySelectorAll('.chatbox-view-contents > .log .log-contents p').forEach(p => { p.style.textShadow = ""})
    }
}

const removeUnwantedElements = (gameframe: HTMLIFrameElement): void => {
	const doc = gameframe.contentDocument;

	if (!doc) {
		return;
	}

	const chatInput = doc.querySelector(
		".chatbox-view-contents>.input input[type=text]"
	) as HTMLInputElement | null;

	if (chatInput) {
		chatInput.placeholder = "";
	}

	const toggleChat = doc.getElementById("toggleChat");

	if (toggleChat?.firstChild) {
		toggleChat.firstChild.remove();
	}
};

export const addTranspUIButton = async (): Promise<void> => {
    const gameframe = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement;
	if (!gameframe?.contentDocument) {
		new Error("Gameframe or contentDocument not found");
		return;
	}

    // wait for the buttons to show up
    const targetElement = await waitForElement(".header-btns");

	const headerButtons = gameframe.contentDocument.getElementsByClassName("header-btns")[0];

    if (gameframe.contentDocument.getElementById("invisui-btn") !== null){
        return;
    }
    
    const prefs = await window.electronAPI.getAppPreferences();
    const enabled = prefs["transp_ui"];
    let transpButton = document.createElement("button") as HTMLButtonElement;
    transpButton.id = "invisui-btn";
    transpButton.innerHTML = enabled ? "Default UI" : "Glass UI";
    transpButton.style.background = enabled
        ? "rgba(26, 33, 37, 0.063)"
        : ""

    transpButton.addEventListener(
        "click",
        async () => {
            const prefs = await window.electronAPI.getAppPreferences();
            const newState = !prefs["transp_ui"]
            transpButton.innerHTML = newState ? "Default UI" : "Glass UI";

            await window.electronAPI.setAppPreference("transp_ui", newState);

            toggleTransparentUI();
        },
        false
    );
    const firstHeaderButton = headerButtons.querySelector("button")
    headerButtons.insertBefore(transpButton, firstHeaderButton)
}

export const setGameView = async (): Promise<void> => {
	const gameframe = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement;

	if (!gameframe?.contentDocument) {
		return;
	}

	await addShortcutListener(gameframe);
	removeUnwantedElements(gameframe);
	await addTranspUIButton();
	await toggleTransparentUI();
	await applyLowLatencyVisuals(gameframe);
};