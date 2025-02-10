import { App, PluginSettingTab, Setting, TFolder } from "obsidian";
import moment from "moment";
import OnThisDayPlugin from "main";

export default class OnThisDaySettingTab extends PluginSettingTab {
	plugin: OnThisDayPlugin;

	constructor(app: App, plugin: OnThisDayPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: "General Settings" });

		const dateSetting = new Setting(containerEl)
			.setName("Date Format")
			.setDesc(
				`Format for daily note filenames. Example: ${moment(
					new Date()
				).format(this.plugin.settings.dateFormat)}`
			)
			.addText((text) => {
				text.setPlaceholder("MMMM D, YYYY")
					.setValue(this.plugin.settings.dateFormat)
					.onChange(async (value) => {
						this.plugin.settings.dateFormat = value;
						await this.plugin.saveSettings();
						// Update the description with a new example using the updated format
						const newExample = moment(new Date()).format(value);
						dateSetting.setDesc(
							`Format for daily note filenames. Example: ${newExample}`
						);
					});
			});

		new Setting(containerEl)
			.setName("Daily Notes Folder")
			.setDesc("Select the folder where your daily notes are stored.")
			.addDropdown((dropdown) => {
				// Create an object to hold the folder options
				const folderOptions: Record<string, string> = {};
				// Get all files from the vault and filter for folders
				const allFolders = this.app.vault
					.getAllLoadedFiles()
					.filter((f): f is TFolder => f instanceof TFolder);
				// Populate the folderOptions with folder paths
				allFolders.forEach((folder) => {
					folderOptions[folder.path] = folder.path;
				});
				// Add each folder option to the dropdown
				for (const key in folderOptions) {
					dropdown.addOption(key, folderOptions[key]);
				}
				// Set the current value from the plugin settings
				dropdown.setValue(this.plugin.settings.dailyNotesFolder);
				dropdown.onChange(async (value: string) => {
					this.plugin.settings.dailyNotesFolder = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Horizontal Lines")
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
			.setName("Custom Prompt Details")
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
			.setName("Placeholder Tag")
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
			.setName("Through the Years Output Header")
			.setDesc(
				"How do you want to title the output block of the Through the Years command? The default is `On This Day`"
			)
			.addText((text) =>
				text
					.setValue("On This Day")
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
			.setName("Output Length (Sentences)")
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
			
		containerEl.createEl("h2", { text: "OpenAI Settings" });
		new Setting(containerEl)
			.setName("Model Version")
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
			.setName("OpenAI API Key")
			.setDesc("Your OpenAI API key.")
			.addText((text) =>
				text
					.setPlaceholder("sk-...")
					.setValue(this.plugin.settings.openaiApiKey)
					.onChange(async (value) => {
						this.plugin.settings.openaiApiKey = value;
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("h2", { text: "Health Estimate Settings" });
		new Setting(containerEl)
			.setName("Health Estimates Placeholder Tag")
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
			.setName("Food Section Header")
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
