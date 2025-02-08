import { MarkdownView,  Notice, Plugin, TFolder } from 'obsidian';
import OpenAI from 'openai';
import { OnThisDayPluginSettings, DEFAULT_SETTINGS } from 'src/OnThisDayPluginSettings';
import OnThisDaySettingTab from 'src/OnThisDaySettingTab';
import aiPrompt from 'src/prompt';

//
// Main Plugin Class
//
export default class OnThisDayPlugin extends Plugin {
	settings: OnThisDayPluginSettings;

	async onload() {
		console.log('Loading On This Day AI plugin');
		await this.loadSettings();
		this.addSettingTab(new OnThisDaySettingTab(this.app, this));

		this.addCommand({
			id: 'on-this-day-ai:on-this-day-placeholder',
			name: 'Add On This Day AI Placeholder',
			callback: async () => {
				await this.addPlaceholder();
			},
		});

		this.addCommand({
			id: 'on-this-day-ai:generate-date-summaries',
			name: 'Generate Through The Years',
			callback: async () => {
				await this.generateDateSummaries();
			},
		});
	}

	async onunload() {
		console.log('Unloading On This Day AI plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	//
	// Utility Functions
	//

	// Check if a string matches the expected date format ("MMMM D, YYYY")
	isValidDateString(dateString: string): boolean {
		const regex =
			/^(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}$/;
		return regex.test(dateString);
	}

	// Parse a date string (assumes "MMMM D, YYYY")
	parseDateFromString(dateString: string, format: string): Date | null {
		// This regex is based on the expected format "MMMM D, YYYY"
		const regex =
			/^(January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2}), (\d{4})$/;
		const match = dateString.match(regex);
		if (match) {
			const monthName = match[1];
			const day = parseInt(match[2]);
			const year = parseInt(match[3]);
			const date = new Date(`${monthName} ${day}, ${year}`);
			if (!isNaN(date.getTime())) {
				return date;
			}
		}
		return null;
	}

	//
	// Main Function: Generate Date Summaries
	//
	async generateDateSummaries() {
		// 1. Ensure the command is run from a file with a valid date as its title.
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice('No active file found.');
			return;
		}
		if (!this.isValidDateString(activeFile.basename)) {
			new Notice(`This command must be run from a file with a date title in the format ${this.settings.dateFormat}`);
			return;
		}

		const inputDateString = activeFile.basename;

		// 2. Parse the input date to extract month and day (ignoring the year)
		const parsedDate = this.parseDateFromString(inputDateString, this.settings.dateFormat);
		if (!parsedDate) {
			new Notice('Could not parse the date from the file title.');
			return;
		}
		const month = parsedDate.getMonth(); // 0-based month
		const day = parsedDate.getDate();
		const currentYear = parsedDate.getFullYear();

		// 3. Search through the daily notes folder for matching files
		const folder = this.app.vault.getAbstractFileByPath(this.settings.dailyNotesFolder);
		if (!folder || !(folder instanceof TFolder)) {
			new Notice('Daily notes folder not found.');
			return;
		}

		// Get all Markdown files in the daily notes folder
		const files = this.app.vault
			.getFiles()
			.filter(
				(file) =>
					file.path.startsWith(this.settings.dailyNotesFolder) && file.extension === 'md'
			);

		// Build a map: year => concatenated content of matching daily notes
		let yearToContent: Record<string, string> = {};
		for (const file of files) {
			const fileDate = this.parseDateFromString(file.basename, this.settings.dateFormat);
			if (!fileDate) continue;
			if (fileDate.getMonth() === month && fileDate.getDate() === day && fileDate.getFullYear() != currentYear) {
				const yearStr = fileDate.getFullYear().toString();
				const content = await this.app.vault.read(file);
				if (yearToContent[yearStr]) {
					yearToContent[yearStr] += '\n' + content;
				} else {
					yearToContent[yearStr] = content;
				}
			}
		}

		if (Object.keys(yearToContent).length === 0) {
			new Notice('No matching daily notes found for that date.');
			return;
		}

		// 4. Construct the API prompt that instructs GPT-4 to produce a JSON summary mapping.
		const prompt = this.constructPrompt(yearToContent, inputDateString);

		// 5. Show a loading indicator (persistent notice) until work is done.
		const loadingNotice = new Notice("Generating summaries...", 0);

		// 6. Call the OpenAI API once with the entire JSON map.
		let responseJSON: Record<string, string>;
		try {
			responseJSON = await this.callOpenAI(prompt);
		} catch (error: any) {
			loadingNotice.hide();
			console.error('API call failed: ' + error.message);
			new Notice('API call failed: ' + error.message);
			return;
		}

		// 7. Build the output markdown block.
		const outputBlock = this.buildOutputBlock(responseJSON, this.settings.horizontalRules);

		// 8. Insert the output block by looking for a placeholder marker.
		// Define a unique placeholder marker.
		const placeholder = "<!OTD>";
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			loadingNotice.hide();
			new Notice('No active editor found.');
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

		editor.setValue(newContent);

		// 9. Hide the loading notice and show a completion notice.
		loadingNotice.hide();
		new Notice('On This Day summaries inserted.');
	}

	//
	// Construct the API Prompt
	//
	constructPrompt(yearToContent: Record<string, string>, inputDateString: string): string {
		const promptInstructions = aiPrompt
		const dataString = JSON.stringify(yearToContent);
		return `${promptInstructions}\n\nData:\n${dataString}`;
	}

	//
	// Call the OpenAI API
	//
	async callOpenAI(prompt: string): Promise<Record<string, string>> {
		const client = new OpenAI({
			apiKey: this.settings.openaiApiKey,
			dangerouslyAllowBrowser: true
		});
	
		try {
			const response = await client.chat.completions.create({
				model: this.settings.model,
				messages: [
					{
						role: 'system',
						content:
							'You are a helpful assistant that summarizes daily journal entries in a strict JSON format.',
					},
					{
						role: 'user',
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
				throw new Error('No valid response received from OpenAI.');
			}
	
			const content = response.choices[0].message.content;
			try {
				const result = JSON.parse(content);
				return result;
			} catch (parseError: any) {
				console.error('Failed to parse JSON from OpenAI response:', parseError);
				throw new Error(
					'Failed to parse JSON from OpenAI response: ' + parseError.message
				);
			}
		} catch (error: any) {
			console.error('OpenAI API error:', error);
			throw new Error('OpenAI API error: ' + error.message);
		}
	}

	//
	// Build the Output Markdown
	//
	buildOutputBlock(summaries: Record<string, string>, horizontalRules: string): string {
		// Add horizontal rules based on settings
		let output = '## On This Day...\n';
		if (horizontalRules.includes('Above')) {
			output = '---\n## On This Day...\n'
		}

		// Optionally, sort the years in descending order
		const years = Object.keys(summaries).sort((a, b) => parseInt(b) - parseInt(a));
		for (const year of years) {
			output += `- **${year}:** ${summaries[year]}\n`;
		}
		if (horizontalRules.includes('Below')) {
			output += "\n---"
		}
		return output;
	}

	addPlaceholder() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			new Notice('No active editor found.');
			return;
		}
		const editor = (activeView as MarkdownView).editor;
		editor.replaceSelection('<!OTD>');
	}
}