//
// Settings Interfaces & Defaults
//
export interface OnThisDayPluginSettings {
	// OpenAI settings
	openaiApiKey: string;
	model: string;
	// General settings
	dailyNotesFolder: string;
	dateFormat: string;
	horizontalRules: string;
	customPrompt: string;
	placeholder: string;
	throughTheYearsHeader: string;
	shouldOutputLinkToNotes: boolean;
	// Health estimate settings
	dietEstimatePlaceholder: string;
}

export const DEFAULT_SETTINGS: OnThisDayPluginSettings = {
	openaiApiKey: "",
	model: "gpt-4",
	dailyNotesFolder: "010 Daily Notes",
	dateFormat: "MMMM D, YYYY",
	horizontalRules: "",
	customPrompt: "",
	placeholder: "<!OTDI>",
	throughTheYearsHeader: "On This Day",
	shouldOutputLinkToNotes: true,
	dietEstimatePlaceholder: "<!OTDI diet>"
};
