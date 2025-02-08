import { MarkdownView, Notice, Plugin, TFolder } from "obsidian";
import OpenAI from "openai";
import { OnThisDayPluginSettings, DEFAULT_SETTINGS } from "src/settings";
import OnThisDaySettingTab from "src/OnThisDaySettingTab";
import { sysPrompt, constructPrompt } from "src/prompt";
import { isValidDateString, parseDateFromString } from "src/dateUtils";
import { getMarkdownFilesInFolder, buildOutputBlock } from "src/markdownUtils";

export default class OnThisDayPlugin extends Plugin {
	settings: OnThisDayPluginSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new OnThisDaySettingTab(this.app, this));

		this.addCommand({
			id: "on-this-day-placeholder",
			name: "Add Placeholder at Cursor",
			callback: async () => {
				await this.addPlaceholder();
			},
		});

		this.addCommand({
			id: "generate-date-summaries",
			name: "Generate Through The Years",
			callback: async () => {
				await this.generateDateSummaries();
			},
		});
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	//
	// Main Function: Generate Date Summaries
	//
	async generateDateSummaries() {
		// Ensure the command is run from a file with a valid date as its title.
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file found.");
			return;
		}
		if (!isValidDateString(activeFile.basename)) {
			new Notice(
				`This command must be run from a file with a date title in the format ${this.settings.dateFormat}`
			);
			return;
		}

		const inputDateString = activeFile.basename;

		// Parse the input date to extract month and day (ignoring the year)
		const parsedDate = parseDateFromString(
			inputDateString,
			this.settings.dateFormat
		);
		if (!parsedDate) {
			new Notice("Could not parse the date from the file title.");
			return;
		}
		const month = parsedDate.getMonth(); // 0-based month
		const day = parsedDate.getDate();
		const currentYear = parsedDate.getFullYear();

		// Get the folder object for the daily notes folder.
		const folder = this.app.vault.getAbstractFileByPath(
			this.settings.dailyNotesFolder
		);
		if (!folder || !(folder instanceof TFolder)) {
			new Notice("Daily notes folder not found.");
			return;
		}
		// Get all files in the folder
		const files = getMarkdownFilesInFolder(folder);

		// Build a map: year => concatenated content of matching daily notes
		let yearToContent: Record<string, string> = {};
		for (const file of files) {
			const fileDate = parseDateFromString(
				file.basename,
				this.settings.dateFormat
			);
			if (!fileDate) continue;
			if (
				fileDate.getMonth() === month &&
				fileDate.getDate() === day &&
				fileDate.getFullYear() != currentYear
			) {
				const yearStr = fileDate.getFullYear().toString();
				const content = await this.app.vault.read(file);
				if (yearToContent[yearStr]) {
					yearToContent[yearStr] += "\n" + content;
				} else {
					yearToContent[yearStr] = content;
				}
			}
		}

		if (Object.keys(yearToContent).length === 0) {
			new Notice("No matching daily notes found for that date.");
			return;
		}

		const prompt = constructPrompt(
			yearToContent,
			this.settings.customPrompt
		);

		// Show a loading indicator (persistent notice) until work is done.
		const loadingNotice = new Notice("Generating summaries...", 0);

		// Call the OpenAI API once with the entire JSON map.
		let responseJSON: Record<string, string>;
		try {
			responseJSON = await this.callOpenAI(prompt);
		} catch (error: any) {
			loadingNotice.hide();
			console.error("API call failed: " + error.message);
			new Notice("API call failed: " + error.message);
			return;
		}

		// Build the output markdown block.
		const outputBlock = buildOutputBlock(
			responseJSON,
			inputDateString,
			this.settings.dateFormat,
			this.settings.horizontalRules,
			this.settings.throughTheYearsHeader
		);

		// Insert the output block by looking for a placeholder marker defined in settings.
		const placeholder = this.settings.placeholder;
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			loadingNotice.hide();
			new Notice("No active editor found.");
			return;
		}
		const editor = (activeView as MarkdownView).editor;
		const currentContent = editor.getValue();
		let newContent = "";

		if (currentContent.includes(placeholder)) {
			// Replace the placeholder with the output block.
			newContent = currentContent.replace(placeholder, outputBlock);
			editor.setValue(newContent);
		} else {
			// If no placeholder is found, place block at cursor location
			editor.replaceSelection(outputBlock);
		}

		// 9. Hide the loading notice and show a completion notice.
		loadingNotice.hide();
		new Notice("On This Day summaries inserted.");
	}

	//
	// Call the OpenAI API
	//
	async callOpenAI(prompt: string): Promise<Record<string, string>> {
		const client = new OpenAI({
			apiKey: this.settings.openaiApiKey,
			dangerouslyAllowBrowser: true,
		});

		try {
			const response = await client.chat.completions.create({
				model: this.settings.model,
				messages: [
					{
						role: "system",
						content: sysPrompt,
					},
					{
						role: "user",
						content: prompt,
					},
				],
				temperature: 0.2,
			});

			// Validate the response structure
			if (
				!response.choices ||
				response.choices.length === 0 ||
				!response.choices[0].message?.content
			) {
				throw new Error("No valid response received from OpenAI.");
			}

			const content = response.choices[0].message.content;
			try {
				const result = JSON.parse(content);
				return result;
			} catch (parseError: any) {
				console.error(
					"Failed to parse JSON from OpenAI response:",
					parseError
				);
				throw new Error(
					"Failed to parse JSON from OpenAI response: " +
						parseError.message
				);
			}
		} catch (error: any) {
			console.error("OpenAI API error:", error);
			throw new Error("OpenAI API error: " + error.message);
		}
	}

	addPlaceholder() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			new Notice("No active editor found.");
			return;
		}
		const editor = (activeView as MarkdownView).editor;
		editor.replaceSelection(this.settings.placeholder);
	}
}
