//
// Settings Interfaces & Defaults
//
export interface OnThisDayPluginSettings {
	openaiApiKey: string;
	model: string;
	dailyNotesFolder: string;
	dateFormat: string;
	horizontalRules: string;
	customPrompt: string;
}

export const DEFAULT_SETTINGS: OnThisDayPluginSettings = {
	openaiApiKey: "",
	model: "gpt-4",
	dailyNotesFolder: "010 Daily Notes",
	dateFormat: "MMMM D, YYYY",
	horizontalRules: "",
	customPrompt: "",
};
