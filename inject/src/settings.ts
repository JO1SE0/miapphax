import { customAlert } from "./alerts";
import { authNewDialog, authShowAlert, resetAuthAlert } from "./auth";
import { loadProfileToLocalStorage } from "./profiles";
import { shortcutListDialog, shortcutNewDialog } from "./shortcuts";
import { createButton } from "./utils";
import { PRESETS, getThemeConfig, isValidHex, themed, updateThemeLive } from "./theme";
import { getLinesConfig, ORIGINAL_WIDTHS, updateLinesLive } from "./lines";

const createToggleRow = (
		labelText: string,
		options: string[],
		defaultOption: string,
		onChange: (selected: string) => void
	): HTMLDivElement => {
		const row = document.createElement('div');
		row.style.display = 'flex';
		row.style.justifyContent = 'space-between';
		row.style.alignItems = 'center';
		row.style.marginBottom = '15px';
		row.style.gap = '12px';

		const label = document.createElement('div');
		label.textContent = labelText;
		label.style.flex = '0 0 180px';
		label.style.fontWeight = 'bold';

		const buttonGroup = document.createElement('div');
		buttonGroup.style.display = 'flex';
		buttonGroup.style.gap = '10px';
		buttonGroup.style.minWidth = '300px';

		const buttonWidth = `${Math.floor(280 / options.length)}px`;

		const buttonsMap: Record<string, HTMLButtonElement> = {};

		options.forEach(option => {
			const btn = document.createElement('button');
			btn.textContent = option;
			btn.style.width = buttonWidth;
			btn.style.padding = '8px 0';
			btn.style.fontSize = '14px';
			btn.style.fontWeight = 'bold';
			btn.style.border = 'none';
			btn.style.borderRadius = '5px';
			btn.style.cursor = 'pointer';
			btn.style.transition = 'background-color 0.2s, color 0.2s';
			btn.style.backgroundColor = '#1b2125';
			btn.style.color = '#aaa';

			const setActive = (isActive: boolean) => {
				btn.style.backgroundColor = isActive ? themed('#244967') : '#1b2125';
				btn.style.color = isActive ? 'white' : '#aaa';
				btn.dataset.active = isActive ? 'true' : 'false';
			};

			btn.addEventListener('click', () => {
				Object.entries(buttonsMap).forEach(([opt, b]) => {
					const active = opt === option;
					b.style.backgroundColor = active ? themed('#244967') : '#1b2125';
					b.style.color = active ? 'white' : '#aaa';
					b.dataset.active = active ? 'true' : 'false';
				});
				onChange(option);
			});

			btn.addEventListener('mouseenter', () => {
				if (btn.dataset.active !== 'true'){
					btn.style.color = 'white';
				} else {
					btn.style.backgroundColor = themed('#3b5d82');
				}
			});
			btn.addEventListener('mouseleave', () => {
				if (btn.dataset.active !== 'true'){
					btn.style.color = '#aaa';
				} else {
					btn.style.backgroundColor = themed('#244967');
				}
			});

			setActive(option === defaultOption);
			buttonsMap[option] = btn;
			buttonGroup.appendChild(btn);
		});

		row.appendChild(label);
		row.appendChild(buttonGroup);
		return row;
};

const createDivider = (): HTMLHRElement => {
	const divider = document.createElement('hr');
	divider.style.border = 'none';
	divider.style.borderTop = '1px solid #444';
	divider.style.margin = '20px 0';
	return divider;
};

// Fila con slider: onLive se llama mientras arrastras, onCommit al soltar.
const createSliderRow = (
		labelText: string,
		value: number,
		min: number,
		max: number,
		step: number,
		onLive: (value: number) => void,
		onCommit: (value: number) => void
	): HTMLDivElement => {
		const row = document.createElement('div');
		row.style.display = 'flex';
		row.style.alignItems = 'center';
		row.style.marginBottom = '15px';
		row.style.gap = '12px';

		const label = document.createElement('label');
		label.textContent = labelText;
		label.style.flex = '0 0 180px';
		label.style.fontWeight = 'bold';

		const slider = document.createElement('input');
		slider.type = 'range';
		slider.min = String(min);
		slider.max = String(max);
		slider.step = String(step);
		slider.value = String(value);
		slider.style.flex = '1';

		const readout = document.createElement('span');
		readout.textContent = value.toFixed(1);
		readout.style.flex = '0 0 36px';
		readout.style.textAlign = 'right';

		slider.addEventListener('input', () => {
			const v = Number(slider.value);
			readout.textContent = v.toFixed(1);
			onLive(v);
		});
		slider.addEventListener('change', () => onCommit(Number(slider.value)));

		row.appendChild(label);
		row.appendChild(slider);
		row.appendChild(readout);
		return row;
};

export const resetPreferencesAlert = (): void => {
    const resetButton = createButton(
		"Confirm Reset",
		"#b2413b", "#D04D46",
		() => {
			window.electronAPI.deletePreferencesFile()
				.then(result => {
					if (result){
						// if preferences deleted, also clear localstorage
						localStorage.clear()
						customAlert(
							"Reset successful", 
							"The app will restart in a few seconds (or do it manually)...", 
							[]
						)
						setTimeout(() => window.electronAPI.restartApp(), 4000)
					}
				})
		}
	)

    customAlert(
        "Are you sure?",
        `This operation will reset the app and delete all your settings.`,
        [resetButton]
    )
}


export const openSettingsAlert = async (): Promise<void> => {
	const prefs = await window.electronAPI.getAppPreferences();

	// -- General Section --
	const generalSection = document.createElement('div');

	const generalHeader = document.createElement('div');
	generalHeader.textContent = "General";
	generalHeader.style.fontSize = '18px';
	generalHeader.style.fontWeight = 'bold';
	generalHeader.style.marginBottom = '10px';

	const generalNote = document.createElement('div');
	generalNote.textContent = "You must restart the app before these settings are applied!";
	generalNote.style.fontSize = '13px';
	generalNote.style.marginBottom = '15px';
	generalNote.style.color = '#ccc';

	const currentFpsSetting = prefs["fps_unlock"] ? "Unlimited" : "Default";
	const fpsRow = createToggleRow(
		'FPS', 
		['Default', 'Unlimited'], 
		currentFpsSetting, 
		(selected) => {
			const newFpsSetting = (selected === "Default") ? false : true;
			window.electronAPI.setAppPreference("fps_unlock", newFpsSetting);
		}
	);

	const currentLowLatencySetting = prefs["low_latency"] === true
	? "Enabled"
	: "Disabled";

const lowLatencyRow = createToggleRow(
	'Low Latency',
	['Disabled', 'Enabled'],
	currentLowLatencySetting,
	(selected) => {
		const enabled = selected === "Enabled";
		window.electronAPI.setAppPreference("low_latency", enabled);
	}
);

	// because discord_rpc was introduced after 0.4.0
	// here we just make sure that if preferences.json doesn't have discord_rpc
	// then we consider it Enabled
	const currentRPCSetting = prefs.hasOwnProperty("discord_rpc")
		? prefs["discord_rpc"] ? "Enabled" : "Disabled"
		: "Enabled";

	const discordRPCRow = createToggleRow(
		'Discord Rich Presence', 
		['Enabled', 'Disabled'], 
		currentRPCSetting, 
		(selected) => {
			const newRPCSetting = (selected === "Enabled") ? true : false;
			window.electronAPI.setAppPreference("discord_rpc", newRPCSetting);
		}
	);

generalSection.appendChild(generalHeader);
generalSection.appendChild(generalNote);
generalSection.appendChild(fpsRow);
generalSection.appendChild(lowLatencyRow);
generalSection.appendChild(discordRPCRow);

	// Application ID de Discord propia (para que diga "TL App")
	const rpcIdWrap = document.createElement('div');
	rpcIdWrap.style.cssText = 'margin:10px 0;display:flex;flex-direction:column;gap:6px;';
	const rpcIdLabel = document.createElement('div');
	rpcIdLabel.textContent = 'Discord Application ID (para que diga TL App; reinicia la app despues)';
	rpcIdLabel.style.cssText = 'font-size:13px;color:#ccc;';
	const rpcIdInput = document.createElement('input');
	rpcIdInput.type = 'text';
	rpcIdInput.placeholder = 'Application ID (solo numeros)';
	rpcIdInput.value = String(prefs["discord_client_id"] || '');
	rpcIdInput.style.cssText = 'padding:8px 10px;font-size:13px;box-sizing:border-box;width:100%;user-select:text;';
	const rpcIdMsg = document.createElement('div');
	rpcIdMsg.style.cssText = 'font-size:12px;color:#aab2c0;';
	const saveRpcId = () => {
		const v = rpcIdInput.value.trim();
		if (v && !/^\d{15,25}$/.test(v)) { rpcIdMsg.textContent = 'Id invalido: son solo numeros.'; return; }
		window.electronAPI.setAppPreference('discord_client_id', v);
		rpcIdMsg.textContent = v ? 'Guardado. Reinicia la app.' : 'Borrado: usa la aplicacion original.';
	};
	rpcIdInput.addEventListener('change', saveRpcId);
	rpcIdInput.addEventListener('input', saveRpcId);
	rpcIdInput.addEventListener('keydown', (e) => e.stopPropagation());
	rpcIdWrap.append(rpcIdLabel, rpcIdInput, rpcIdMsg);
	generalSection.appendChild(rpcIdWrap);

	// -- Shortcuts Section --
	const shortcutsSection = document.createElement('div');

	const shortcutsHeader = document.createElement('div');
	shortcutsHeader.textContent = "Shortcuts";
	shortcutsHeader.style.fontSize = '18px';
	shortcutsHeader.style.fontWeight = 'bold';
	shortcutsHeader.style.marginBottom = '10px';

	const shortcutsMessage = document.createElement('div');
	shortcutsMessage.textContent = 'Shortcuts let you type frequent commands, messages, or emojis, by automatically expanding text written in chat.';
	shortcutsMessage.style.fontSize = '13px';
	shortcutsMessage.style.marginBottom = '10px';
	shortcutsMessage.style.lineHeight = '1.4';
	shortcutsMessage.style.color = '#ccc';

	const shortcutsActionRow = document.createElement('div');
	shortcutsActionRow.style.display = 'flex';
	shortcutsActionRow.style.justifyContent = 'space-between';
	shortcutsActionRow.style.gap = '10px';

	const createShortcutButton = createButton("Create new shortcut", "#244967", "#3b5d82", () => {
		shortcutNewDialog();
	})
	const viewShortcutsButton = createButton("View shortcuts", "#244967", "#3b5d82", () => {
		shortcutListDialog();
	})

	shortcutsActionRow.appendChild(createShortcutButton);
	shortcutsActionRow.appendChild(viewShortcutsButton);

	shortcutsSection.appendChild(shortcutsHeader);
	shortcutsSection.appendChild(shortcutsMessage);
	shortcutsSection.appendChild(shortcutsActionRow);
	shortcutsSection.appendChild(createDivider());

	// -- Auth Section --
	const authSection = document.createElement('div');

	const authHeader = document.createElement('div');
	authHeader.textContent = "Auth";
	authHeader.style.fontSize = '18px';
	authHeader.style.fontWeight = 'bold';
	authHeader.style.marginBottom = '10px';

	const authMessage = document.createElement('div');
	authMessage.textContent = 'Your auth is typically used by room admins to log you in. Here you can view your current auth or change it, for example if you want to recover the room accounts you had on your browser.';
	authMessage.style.fontSize = '13px';
	authMessage.style.marginBottom = '10px';
	authMessage.style.lineHeight = '1.4';
	authMessage.style.color = '#ccc';

	const authActionRow = document.createElement('div');
	authActionRow.style.display = 'flex';
	authActionRow.style.justifyContent = 'space-between';
	authActionRow.style.gap = '10px';

	const viewAuthButton = createButton("View Auth", "#244967", "#3b5d82", () => {
		const player_auth_key = localStorage.getItem("player_auth_key");
		const publicAuth = player_auth_key.split(".")[1]
		const privateKey = player_auth_key
		authShowAlert(publicAuth, privateKey)
	})
	const changeAuthButton = createButton("Change Auth", "#244967", "#3b5d82", () => {
		authNewDialog();
	})
	const resetAuthButton = createButton("Reset Auth", "#b2413b", "#D04D46", () => {
		resetAuthAlert();
	})

	authActionRow.appendChild(viewAuthButton);
	authActionRow.appendChild(changeAuthButton);
	authActionRow.appendChild(resetAuthButton);

	authSection.appendChild(authHeader);
	authSection.appendChild(authMessage);
	authSection.appendChild(authActionRow);
	authSection.appendChild(createDivider());

	// -- Backup Section --
	const backupSection = document.createElement('div');

	const backupHeader = document.createElement('div');
	backupHeader.textContent = "Backup & Reset";
	backupHeader.style.fontSize = '18px';
	backupHeader.style.fontWeight = 'bold';
	backupHeader.style.marginBottom = '10px';

	const backupMessage = document.createElement('div');
	backupMessage.textContent = 'You can export or restore a full backup of your settings, including profiles, shortcuts, and notes. Or reset the app completely.';
	backupMessage.style.fontSize = '13px';
	backupMessage.style.marginBottom = '10px';
	backupMessage.style.lineHeight = '1.4';
	backupMessage.style.color = '#ccc';

	const backupActionRow = document.createElement('div');
	backupActionRow.style.display = 'flex';
	backupActionRow.style.justifyContent = 'space-between';
	backupActionRow.style.gap = '10px';

	const exportBackupButton = createButton("Export Backup", "#244967", "#3b5d82", () => {
		window.electronAPI.exportPreferencesFile()
			.then(result => {
				if (result.success) {
					exportBackupButton.textContent = "Exported!";
					setTimeout(() => exportBackupButton.textContent = "Export Backup", 2000);
				}
			});
	});

	const importBackupButton = createButton("Restore Backup", "#244967", "#3b5d82", () => {
		window.electronAPI.importPreferencesFile()
			.then(result => {
				if (result.success) {
					customAlert("Backup restored", "The app will restart in a few seconds (or do it manually)...", []);
					loadProfileToLocalStorage("default");
					setTimeout(() => window.electronAPI.restartApp(), 4000);
				} else {
					importBackupButton.textContent = "Invalid backup!";
					importBackupButton.disabled = true;
					importBackupButton.style.backgroundColor = "#D04D46";
					setTimeout(() => {
						importBackupButton.textContent = "Restore Backup";
						importBackupButton.style.backgroundColor = "#244967";
						importBackupButton.disabled = false;
					}, 2000);
				}
			});
	});

	const resetAppButton = createButton("Reset App", "#b2413b", "#D04D46", () => {
		resetPreferencesAlert();
	});

	backupActionRow.appendChild(exportBackupButton);
	backupActionRow.appendChild(importBackupButton);
	backupActionRow.appendChild(resetAppButton);

	backupSection.appendChild(backupHeader);
	backupSection.appendChild(backupMessage);
	backupSection.appendChild(backupActionRow);

	// -- Graphics Section (grosor de lineas) --
	const graphicsSection = document.createElement('div');

	const graphicsHeader = document.createElement('div');
	graphicsHeader.textContent = "Graphics";
	graphicsHeader.style.fontSize = '18px';
	graphicsHeader.style.fontWeight = 'bold';
	graphicsHeader.style.marginBottom = '10px';

	const graphicsNote = document.createElement('div');
	graphicsNote.textContent = "Line thickness. Applies instantly (enter a room to see it). 0 hides the line. F8 toggles thin lines on/off. Original values: field 3, ball 2, players 2.";
	graphicsNote.style.fontSize = '13px';
	graphicsNote.style.marginBottom = '15px';
	graphicsNote.style.lineHeight = '1.4';
	graphicsNote.style.color = '#ccc';

	const lines = getLinesConfig();

	const linesToggleRow = createToggleRow(
		'Thin lines',
		['Original', 'Custom'],
		lines.enabled ? 'Custom' : 'Original',
		(selected) => {
			const enabled = selected === 'Custom';
			updateLinesLive({ enabled });
			window.electronAPI.setAppPreference("lines_enabled", enabled);
		}
	);

	const sliderFor = (
		labelText: string,
		key: 'field' | 'ball' | 'players',
		prefKey: string
	) => createSliderRow(
		labelText,
		lines[key],
		0, 6, 0.1,
		(v) => updateLinesLive({ [key]: v }),
		(v) => window.electronAPI.setAppPreference(prefKey, v)
	);

	const fieldRow = sliderFor('Field lines', 'field', 'line_width_field');
	const ballRow = sliderFor('Ball & objects', 'ball', 'line_width_ball');
	const playersRow = sliderFor('Players', 'players', 'line_width_players');

	const resetLinesButton = createButton("Reset line widths", "#244967", "#3b5d82", () => {
		updateLinesLive({ ...ORIGINAL_WIDTHS });
		window.electronAPI.setAppPreference("line_width_field", ORIGINAL_WIDTHS.field);
		window.electronAPI.setAppPreference("line_width_ball", ORIGINAL_WIDTHS.ball);
		window.electronAPI.setAppPreference("line_width_players", ORIGINAL_WIDTHS.players);
		// llevar los sliders a los valores originales
		([[fieldRow, 'field'], [ballRow, 'ball'], [playersRow, 'players']] as const).forEach(([row, key]) => {
			const slider = row.querySelector('input') as HTMLInputElement;
			const readout = row.querySelector('span') as HTMLSpanElement;
			slider.value = String(ORIGINAL_WIDTHS[key]);
			readout.textContent = ORIGINAL_WIDTHS[key].toFixed(1);
		});
	});

	graphicsSection.appendChild(graphicsHeader);
	graphicsSection.appendChild(graphicsNote);
	graphicsSection.appendChild(linesToggleRow);
	graphicsSection.appendChild(fieldRow);
	graphicsSection.appendChild(ballRow);
	graphicsSection.appendChild(playersRow);
	graphicsSection.appendChild(resetLinesButton);

	// -- Theme Section (tema moderno + color de acento) --
	const themeSection = document.createElement('div');

	const themeHeader = document.createElement('div');
	themeHeader.textContent = "Theme";
	themeHeader.style.fontSize = '18px';
	themeHeader.style.fontWeight = 'bold';
	themeHeader.style.marginBottom = '10px';

	const themeNote = document.createElement('div');
	themeNote.textContent = "Pick the accent color of the interface. Changes apply instantly. Original brings back the stock look.";
	themeNote.style.fontSize = '13px';
	themeNote.style.marginBottom = '15px';
	themeNote.style.lineHeight = '1.4';
	themeNote.style.color = '#ccc';

	const theme = getThemeConfig();

	const themeToggleRow = createToggleRow(
		'Style',
		['Original', 'Modern'],
		theme.enabled ? 'Modern' : 'Original',
		(selected) => {
			const enabled = selected === 'Modern';
			updateThemeLive({ enabled });
			window.electronAPI.setAppPreference("theme_enabled", enabled);
		}
	);

	// selector de color: muestras + color libre
	const colorRow = document.createElement('div');
	colorRow.style.display = 'flex';
	colorRow.style.alignItems = 'center';
	colorRow.style.flexWrap = 'wrap';
	colorRow.style.gap = '10px';
	colorRow.style.marginBottom = '10px';

	const colorLabel = document.createElement('label');
	colorLabel.textContent = 'Accent color';
	colorLabel.style.flex = '0 0 180px';
	colorLabel.style.fontWeight = 'bold';

	const swatches = document.createElement('div');
	swatches.style.display = 'flex';
	swatches.style.alignItems = 'center';
	swatches.style.gap = '8px';
	swatches.style.flexWrap = 'wrap';

	const customPicker = document.createElement('input');
	customPicker.type = 'color';
	customPicker.value = isValidHex(theme.accent) && theme.accent.length === 7 ? theme.accent : '#3b82f6';
	customPicker.title = 'Custom color';
	customPicker.style.width = '34px';
	customPicker.style.height = '28px';
	customPicker.style.padding = '0';
	customPicker.style.border = 'none';
	customPicker.style.background = 'none';
	customPicker.style.cursor = 'pointer';

	const swatchButtons: HTMLButtonElement[] = [];
	const markSelected = (hex: string) => {
		swatchButtons.forEach((b) => {
			const on = b.dataset.hex?.toLowerCase() === hex.toLowerCase();
			b.style.outline = on ? '2px solid #fff' : '2px solid transparent';
		});
	};

	const chooseAccent = (hex: string, persist: boolean) => {
		updateThemeLive({ accent: hex, enabled: true });
		markSelected(hex);
		if (persist) {
			window.electronAPI.setAppPreference("theme_accent", hex);
			window.electronAPI.setAppPreference("theme_enabled", true);
		}
	};

	PRESETS.forEach((preset) => {
		const b = document.createElement('button');
		b.title = preset.name;
		b.dataset.hex = preset.hex;
		// estilos inline a proposito: no deben ser recoloreados por el tema
		b.style.cssText = `width:28px;height:28px;border-radius:50% !important;border:none;padding:0;cursor:pointer;background:${preset.hex} !important;outline:2px solid transparent;outline-offset:2px;`;
		b.addEventListener('click', () => {
			customPicker.value = preset.hex;
			chooseAccent(preset.hex, true);
		});
		swatchButtons.push(b);
		swatches.appendChild(b);
	});

	customPicker.addEventListener('input', () => chooseAccent(customPicker.value, false));
	customPicker.addEventListener('change', () => chooseAccent(customPicker.value, true));
	swatches.appendChild(customPicker);
	markSelected(theme.accent);

	colorRow.appendChild(colorLabel);
	colorRow.appendChild(swatches);

	themeSection.appendChild(themeHeader);
	themeSection.appendChild(themeNote);
	themeSection.appendChild(themeToggleRow);
	themeSection.appendChild(colorRow);

	// -- Combine All Sections --
	const container = document.createElement('div');
	container.appendChild(generalSection);
	container.appendChild(createDivider());
	container.appendChild(themeSection);
	container.appendChild(createDivider());
	container.appendChild(graphicsSection);
	container.appendChild(createDivider());
	container.appendChild(shortcutsSection);
	container.appendChild(authSection);
	container.appendChild(backupSection);

	// -- Show Alert --
	customAlert('Settings', container, []);
};