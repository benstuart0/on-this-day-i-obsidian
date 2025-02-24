import { App, AbstractInputSuggest } from "obsidian";

export class FolderSuggest extends AbstractInputSuggest<string> {
	private folderOptions: string[];

	/**
	 * Constructs a new FolderSuggest.
	 * @param app - The Obsidian App instance.
	 * @param textInputEl - The HTMLInputElement (or contentEditable div) to attach the suggestion to.
	 * @param folderOptions - An array of folder path strings to suggest.
	 */
	constructor(
		app: App,
		textInputEl: HTMLInputElement,
		folderOptions: string[]
	) {
		super(app, textInputEl);
		this.folderOptions = folderOptions;
		this.limit = 20;
	}

	/**
	 * Returns an array of folder paths that match the given query.
	 */
	protected getSuggestions(query: string): string[] {
		return this.folderOptions.filter((option) =>
			option.toLowerCase().includes(query.toLowerCase())
		);
	}

	/**
	 * Renders a suggestion item in the suggestion dropdown.
	 * @param suggestion - The folder path suggestion.
	 * @param el - The HTMLElement in which to render the suggestion.
	 */
	renderSuggestion(suggestion: string, el: HTMLElement): void {
		el.textContent = suggestion;
	}

	/**
	 * Called when the user selects a suggestion.
	 * Updates the input field with the chosen folder path.
	 */
	onChooseSuggestion(suggestion: string): void {
		this.setValue(suggestion);
	}
}
