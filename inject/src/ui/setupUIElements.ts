import { removeAds } from "./removeAds";
import { addAddressBarToHeader, setupCustomHeader } from "./setupCustomHeader";
import { setupRoomDropdown } from "./roomDropdown";

export const setupUIElements = async (): Promise<void> => {
	await removeAds();
	await setupCustomHeader();
	addAddressBarToHeader();
	setupRoomDropdown();
}