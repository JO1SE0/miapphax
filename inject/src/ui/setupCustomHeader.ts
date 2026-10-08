import { customAlert } from "../alerts";
import { Profile, profileManage } from "../profiles";
import { openSettingsAlert } from "../settings";
import { waitForElement } from "../waitForElement";
import { URL } from "../constants";
import { BRAND_LOGO } from "../brand";

const aboutAlert = (): void => {
    customAlert(
        "About",
        `<b>TL App</b> — cliente personal de HaxBall para Toda la Lecce.

        Basado en el cliente open source de <b>@og9525</b> (GPL-3.0).

        Unlike similar projects, it is open source and downloadable without any registration.

        Thank you for checking it out!

        Make sure you only download this app from the official website:
        <a target="_blank" href=${URL.website}>${URL.website}</a>

        Join the official Discord server:
        <a target="_blank" href=${URL.discord}/>${URL.discord}</a>

        <b>Credits</b>
        • <a target="_blank" href=https://github.com/electron/electron>Electron</a>, for making this app's creation easy
        • <a target="_blank" href=https://github.com/xenonsb/Haxball-Room-Extension>All-in-one Tool</a>, for improving HaxBall and open sourcing their code`,
        []
    );
}

export const helpAlert = (): void => {
    const officialWebsiteButton = document.createElement('button');
    officialWebsiteButton.innerText = 'Website';
    officialWebsiteButton.onclick = () => {
        window.open(URL.website, "_blank");
    };

    const discordButton = document.createElement('button');
    discordButton.innerText = 'Discord';
    discordButton.onclick = () => {
        window.open(URL.discord, "_blank");
    };

    customAlert(
        "Help",
        `Visit the official website or our Discord server.
        `,
        [officialWebsiteButton, discordButton]
    )
}


export const addAddressBarToHeader = (): void => {
    const centerContainer = document.getElementsByClassName("center-container")[0];
    if (!centerContainer) return;

    centerContainer.innerHTML = "";

    const addressInput = document.createElement("input");
    addressInput.type = "text";
    addressInput.placeholder = "Pega el link de una sala";
    addressInput.classList.add("address-bar-input");

    // Base styles
    addressInput.style.backgroundColor = "rgba(8, 16, 31, 0.7)";
    addressInput.style.color = "white";
    addressInput.style.border = "1px solid rgba(208, 184, 120, 0.25)";
    addressInput.style.borderRadius = "6px";
    addressInput.style.padding = "2px 6px";
    addressInput.style.width = "200px";
    addressInput.style.maxWidth = "100%";
    addressInput.style.boxSizing = "border-box";
    addressInput.style.fontSize = "16px";
    addressInput.style.outline = "none";
    addressInput.style.transition = "width 0.4s ease, border-color 0.3s ease, box-shadow 0.3s ease";
    addressInput.style.textAlign = "center";

    // Focus effect
    addressInput.addEventListener("focus", () => {
        addressInput.style.width = "100%";
		addressInput.style.border = "2px solid #d0b878";
        addressInput.style.boxShadow = "0 0 10px rgba(208, 184, 120, 0.35)"; // subtle glow
    });

    // Blur effect
    addressInput.addEventListener("blur", () => {
		if (addressInput.value === "") {
			addressInput.style.width = "200px";
		}
		addressInput.style.border = "1px solid rgba(208, 184, 120, 0.25)";
		addressInput.style.boxShadow = "none";
	});

	addressInput.addEventListener("input", () => {
		const roomLink = addressInput.value.trim();
		const isValid = /^https:\/\/www\.haxball\.com\/play\?c=.{11}$/.test(roomLink);
	
		if (roomLink === "") {
			// Reset to default color when empty
			addressInput.style.color = "white";
		} else if (isValid) {
			addressInput.style.color = "white"; // Valid input stays white
		} else {
			addressInput.style.color = "rgba(255, 110, 110, 0.9)"; // Invalid = red text
		}
	});

    // Shake animation (CSS keyframes)
    const style = document.createElement("style");
    style.innerHTML = `
        @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-4px); }
            50% { transform: translateX(4px); }
            75% { transform: translateX(-4px); }
            100% { transform: translateX(0); }
        }
        .shake {
            animation: shake 0.3s ease;
        }
    `;
    document.head.appendChild(style);

    // Append the input
    centerContainer.appendChild(addressInput);

    // Expose a global function to trigger shake (for validation error)
    (window as any).triggerInvalidInput = (input: string) => {
		addressInput.placeholder = "Link invalido"
		addressInput.value = "";
		// Inject a <style> tag dynamically
		const style = document.createElement("style");
		style.textContent = `
			.address-bar-input::placeholder {
				color: rgba(255, 110, 110, 1) !important;
				opacity: 0.8;
			}
		`;
		document.head.appendChild(style);
        addressInput.classList.add("shake");
        setTimeout(() => {
			addressInput.placeholder = "Pega el link de una sala"
			addressInput.value = input;
            addressInput.classList.remove("shake");
			document.head.removeChild(style);
        }, 600);
    };

	addressInput.addEventListener("keydown", (e) => {
		if (e.key === "Enter") {
			e.preventDefault(); // prevent form submission / default action
			const roomLink = addressInput.value.trim();
			const isValid = /^https:\/\/www\.haxball\.com\/play\?c=.{11}$/.test(roomLink);
	
			if (isValid) {
                addressInput.value = ""
                addressInput.placeholder = "Entrando a la sala..."
				setTimeout(() => {
                    window.location.href = roomLink;
                }, 1000)
			} else {
				(window as any).triggerInvalidInput(roomLink);
			}
		}
	});
};

export const setupCustomHeader = async (): Promise<void> => {
    const targetElement = await waitForElement(
        "body > div > div.flexCol.flexGrow > div",
        false
    );

    if (!document.getElementById('font-awesome-4')) {
        const fa = document.createElement('link');
        fa.id = 'font-awesome-4';
        fa.rel = 'stylesheet';
        fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css';
        document.head.appendChild(fa);
    }

    const header = document.getElementsByClassName("header")[0] as HTMLElement;
    header.innerHTML = ""; // clear old header

    // 🆕 Use CSS Grid to split into 3 equal sections
    header.style.height = "52px";
    header.style.display = "grid";
    header.style.gridTemplateColumns = "1fr 1fr 1fr"; // 3 equal parts
    header.style.alignItems = "center";
    header.classList.add("tl-header");
    header.style.width = "100%";

    const leftContainer = document.createElement("div");
    leftContainer.classList.add("left-container");
    leftContainer.style.display = "flex";
    leftContainer.style.alignItems = "center";
    leftContainer.style.justifyContent = "flex-start"; // align left

    const centerContainer = document.createElement("div");
    centerContainer.classList.add("center-container");
    centerContainer.style.display = "flex";
    centerContainer.style.alignItems = "center";
    centerContainer.style.justifyContent = "center"; // align center

    const rightContainer = document.createElement("div");
    rightContainer.classList.add("right-container");
    rightContainer.style.display = "flex";
    rightContainer.style.alignItems = "center";
    rightContainer.style.justifyContent = "flex-end"; // align right
    rightContainer.style.marginRight = "0";
    

    // Create the new elements
    const titleSpan = document.createElement("span");
    titleSpan.classList.add("title");
    const titleLink = document.createElement("a");
    // titleLink.href = "https://www.haxball.com/play";
    titleLink.textContent = "TL App";
    titleLink.classList.add("tl-wordmark");
    const crest = document.createElement("img");
    crest.src = BRAND_LOGO;
    crest.alt = "";
    crest.classList.add("tl-crest");
    const brandText = document.createElement("span");
    brandText.classList.add("tl-brand-text");
    const sub = document.createElement("span");
    sub.classList.add("tl-sub");
    sub.textContent = "Toda la Lecce";
    brandText.append(titleLink, sub);
    titleSpan.classList.add("tl-brand");
    titleSpan.append(crest, brandText);

    leftContainer.appendChild(titleSpan);

    const currentProfileId = localStorage.getItem("current_profile") || "default";
    localStorage.setItem("current_profile", currentProfileId)
    const prefs = await window.electronAPI.getAppPreferences();
    const currentProfile = prefs["profiles"]
        .find((p: Profile) => p.id === currentProfileId);
    const currentProfileName = (currentProfile !== undefined) 
        ? currentProfile.name 
        : "(unknown)"
    
    const currentProfileEl = document.createElement("span");
    currentProfileEl.classList.add("title"); // same style as the title
    currentProfileEl.style.marginLeft = "15px";
    const currentProfileElLink = document.createElement("a");
    currentProfileElLink.href = "";
    currentProfileElLink.innerHTML = `<i class="fa fa-user" aria-hidden="true"></i> ${currentProfileName}`;
    currentProfileEl.appendChild(currentProfileElLink);

    currentProfileEl.addEventListener("click", function (event) {
        event.preventDefault();
        profileManage();
    });
    rightContainer.appendChild(currentProfileEl);

    // Append all containers to the header
    header.appendChild(leftContainer);
    header.appendChild(centerContainer);
    header.appendChild(rightContainer);

    localStorage.setItem("header_visible", "true")

    const gameframe = document.getElementsByClassName('gameframe')[0] as HTMLIFrameElement;
    gameframe.contentWindow.addEventListener("keydown", (e) => {
        if (e.key.toLowerCase() === "h") {
            toggleHeaderVisibility();
        }
    });
};

export const toggleHeaderVisibility = (): void => {
    const header = document.getElementsByClassName("header")[0] as HTMLElement;
    const existingArrow = document.getElementById("header-toggle-arrow");

    header.style.transition = 'height 0.3s';
    header.style.overflow = 'hidden'; // Ensure it hides smoothly

    const isVisible = getComputedStyle(header).height !== "0px";

    if (!isVisible) {
        // Show header
        localStorage.setItem("header_visible", "true")
        header.style.height = "52px";

        // Remove arrow if it exists
        if (existingArrow) {
            existingArrow.remove();
        }
    } else {
        // Hide header
        localStorage.setItem("header_visible", "false")
        header.style.height = "0px";

        // (sin cartel "Show header": la barra vuelve sola al salir de la sala; H la alterna)
    }
};