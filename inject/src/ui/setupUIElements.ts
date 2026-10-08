import { removeAds } from "./removeAds";
import { setupCustomHeader } from "./setupCustomHeader";

export const setupUIElements = async (): Promise<void> => {
	await removeAds();
	await setupCustomHeader();
}