import { App, PluginSettingTab, Setting, TFolder } from 'obsidian';
import moment from 'moment';
import OnThisDayPlugin from 'main';
import { validateInputTools } from 'openai/lib/parser';

//
// Settings Tab
//
export default class OnThisDaySettingTab extends PluginSettingTab {
	plugin: OnThisDayPlugin;

	constructor(app: App, plugin: OnThisDayPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', { text: 'On This Day AI Settings' });

		// Date Format Setting with dynamic example using the current setting
		const dateSetting = new Setting(containerEl)
		.setName('Date Format')
		.setDesc(`Format for daily note filenames. Example: ${moment(new Date()).format(this.plugin.settings.dateFormat)}`)
		.addText((text) => {
			text
				.setPlaceholder('MMMM D, YYYY')
				.setValue(this.plugin.settings.dateFormat)
				.onChange(async (value) => {
					this.plugin.settings.dateFormat = value;
					await this.plugin.saveSettings();
					// Update the description with a new example using the updated format
					const newExample = moment(new Date()).format(value);
					dateSetting.setDesc(`Format for daily note filenames. Example: ${newExample}`);
				});
		});

		// Daily Notes Folder Setting
		new Setting(containerEl)
			.setName('Daily Notes Folder')
			.setDesc('Select the folder where your daily notes are stored.')
			.addDropdown((dropdown) => {
				// Create an object to hold the folder options
				const folderOptions: Record<string, string> = {};
				// Get all files from the vault and filter for folders
				const allFolders = this.app.vault.getAllLoadedFiles().filter((f) => f instanceof TFolder) as TFolder[];
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

		// OpenAI API Key Setting
		new Setting(containerEl)
			.setName('OpenAI API Key')
			.setDesc('Your OpenAI API key.')
			.addText((text) =>
				text
					.setPlaceholder('sk-...')
					.setValue(this.plugin.settings.openaiApiKey)
					.onChange(async (value) => {
						this.plugin.settings.openaiApiKey = value;
						await this.plugin.saveSettings();
					})
			);

		// Model Version Dropdown Setting
		new Setting(containerEl)
			.setName('Model Version')
			.setDesc('Select the OpenAI model to use.')
			.addDropdown((dropdown) => {
				dropdown.addOption('gpt-3.5-turbo', 'gpt-3.5-turbo');
				dropdown.addOption('gpt-4', 'gpt-4');
				dropdown.setValue(this.plugin.settings.model);
				dropdown.onChange(async (value: string) => {
					this.plugin.settings.model = value;
					await this.plugin.saveSettings();
				});
            });
        new Setting(containerEl)
            .setName('Horizontal Rules')
            .setDesc('Would you like horizontal rules above or below the output block?')
            .addDropdown((dropdown) => {
                dropdown.addOption('', 'None');
                dropdown.addOption('Below', 'Below');
                dropdown.addOption('Above', 'Above');
                dropdown.addOption('Above Below', 'Both');
                dropdown.setValue(this.plugin.settings.horizontalRules);
                dropdown.onChange(async (value: string) => {
                    this.plugin.settings.horizontalRules = value;
                    await this.plugin.saveSettings();
                })
            })
	}
}