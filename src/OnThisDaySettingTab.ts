import { App, PluginSettingTab, Setting, TFolder, moment } from "obsidian";
import OnThisDayPlugin from "main";
import { FolderSuggest } from "./FolderSuggest";

export default class OnThisDaySettingTab extends PluginSettingTab {
	plugin: OnThisDayPlugin;

	constructor(app: App, plugin: OnThisDayPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		const dateSetting = new Setting(containerEl)
			.setName("Date format")
			.setDesc(
				`Format for daily note filenames. Example: ${moment(
					new Date()
				).format(this.plugin.settings.dateFormat)}`
			)
			.addMomentFormat((momentFormat) => {
				momentFormat
					.setDefaultFormat("MMMM D, YYYY")
					.setValue(this.plugin.settings.dateFormat)
					.onChange(async (value) => {
						this.plugin.settings.dateFormat = value;
						await this.plugin.saveSettings();
						const newExample = moment(new Date()).format(value);
						// Update the description with a new example using the updated format
						dateSetting.setDesc(
							`Format for daily note filenames. Example: ${newExample}`
						);
					});
			});

		new Setting(containerEl)
			.setName("Daily notes folder")
			.setDesc("Select the folder where your daily notes are stored.")
			.addText((textComponent) => {
				textComponent.setValue(
					this.plugin.settings.dailyNotesFolder || ""
				);
				// Set a placeholder to prompt the user.
				textComponent.setPlaceholder("Search for folder...");
				// Retrieve folder options by filtering all loaded files for TFolder instances.
				const folderOptions: string[] = this.app.vault
					.getAllLoadedFiles()
					.filter((f): f is TFolder => f instanceof TFolder)
					.map((folder) => folder.path);
				const folderSuggest = new FolderSuggest(
					this.app,
					textComponent.inputEl,
					folderOptions
				);
				// Save to settings and update text when a suggestion is chosen
				folderSuggest.onSelect(
					(suggestion: string, evt: MouseEvent | KeyboardEvent) => {
						textComponent.setValue(suggestion);
						this.plugin.settings.dailyNotesFolder = suggestion;
						this.plugin.saveSettings();
						folderSuggest.close();
					}
				);
			});

		new Setting(containerEl)
			.setName("Horizontal lines")
			.setDesc(
				"Would you like horizontal lines above or below the output block?"
			)
			.addDropdown((dropdown) => {
				dropdown.addOption("", "None");
				dropdown.addOption("Below", "Below");
				dropdown.addOption("Above", "Above");
				dropdown.addOption("Above Below", "Both");
				dropdown.setValue(this.plugin.settings.horizontalRules);
				dropdown.onChange(async (value: string) => {
					this.plugin.settings.horizontalRules = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Custom prompt details")
			.setDesc(
				"Add custom details to the prompt if you prefer. E.g., Please prioritize things I accomplished or only tell me positive things."
			)
			.addTextArea((textArea) => {
				textArea
					.setValue(this.plugin.settings.customPrompt)
					.onChange(async (value) => {
						this.plugin.settings.customPrompt = value;
						await this.plugin.saveSettings();
					});
				// Optionally adjust the textarea appearance, e.g., set a fixed number of rows:
				textArea.inputEl.rows = 5;
			});

		new Setting(containerEl)
			.setName("Placeholder tag")
			.setDesc(
				"The plugin will search for this text in your active file to replace with its return block. Otherwise outputs at cursor. Default <!OTDI>"
			)
			.addText((text) =>
				text
					.setValue(this.plugin.settings.placeholder || "<!OTDI>")
					.onChange(async (value) => {
						this.plugin.settings.placeholder = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Through the years output header")
			.setDesc(
				"How do you want to title the output block of the Through the Years command? The default is `On This Day`"
			)
			.addText((text) =>
				text
					.setValue(
						this.plugin.settings.throughTheYearsHeader ||
							"On This Day"
					)
					.onChange(async (value) => {
						this.plugin.settings.throughTheYearsHeader = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Link to yearly notes in output")
			.setDesc(
				"If enabled, includes [[]] style links to previous years' notes in output block"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.shouldOutputLinkToNotes)
					.onChange(async (value: boolean) => {
						this.plugin.settings.shouldOutputLinkToNotes = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Output length (sentences)")
			.setDesc(
				"Select how many sentences should each year's response be (between 1 and 8)."
			)
			.addDropdown((dropdown) => {
				// Populate the dropdown with options 1 through 8.
				for (let i = 1; i <= 8; i++) {
					dropdown.addOption(i.toString(), i.toString());
				}
				// Set the current value from settings; default to 3 if not set.
				const currentValue =
					this.plugin.settings.outputLengthSentences || 3;
				dropdown.setValue(currentValue.toString());
				dropdown.onChange(async (value: string) => {
					this.plugin.settings.outputLengthSentences =
						parseInt(value);
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl).setName("OpenAI").setHeading();
		new Setting(containerEl)
			.setName("Model sersion")
			.setDesc("Select the OpenAI model to use.")
			.addDropdown((dropdown) => {
				dropdown.addOption("gpt-3.5-turbo", "gpt-3.5-turbo");
				dropdown.addOption("gpt-4", "gpt-4");
				dropdown.setValue(this.plugin.settings.model);
				dropdown.onChange(async (value: string) => {
					this.plugin.settings.model = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("OpenAI api key")
			.setDesc("Your OpenAI api key.")
			.addText((text) =>
				text
					.setPlaceholder("sk-...")
					.setValue(this.plugin.settings.openaiApiKey)
					.onChange(async (value) => {
						this.plugin.settings.openaiApiKey = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl).setName("Health estimates").setHeading();
		new Setting(containerEl)
			.setName("Health estimates placeholder tag")
			.setDesc(
				"The plugin will search for this text in your active file to replace with its return block. Otherwise outputs at cursor. Default <!OTDI diet>"
			)
			.addText((text) =>
				text
					.setPlaceholder("<!OTDI diet>")
					.setValue(
						this.plugin.settings.dietEstimatePlaceholder ||
							"<!OTDI diet>"
					)
					.onChange(async (value) => {
						this.plugin.settings.dietEstimatePlaceholder = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Food section header")
			.setDesc(
				"Enter the header that marks the food section in your daily note. Default is '### Food'."
			)
			.addText((text) =>
				text
					.setPlaceholder("### Food")
					.setValue(this.plugin.settings.foodHeader || "### Food")
					.onChange(async (value) => {
						this.plugin.settings.foodHeader = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
