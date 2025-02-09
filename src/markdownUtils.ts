import { TFile, TFolder } from "obsidian";
import moment from 'moment';

/**
 * Recursively collects all Markdown files (TFile) from the given folder.
 */
export function getMarkdownFilesInFolder(folder: TFolder): TFile[] {
	let files: TFile[] = [];
	for (const child of folder.children) {
		if (child instanceof TFile && child.extension === "md") {
			files.push(child);
		} else if (child instanceof TFolder) {
			files = files.concat(getMarkdownFilesInFolder(child));
		}
	}
	return files;
}

export function buildOutputBlock(
	summaries: Record<string, string>,
	inputDateString: string,
	dateFormat: string,
	horizontalRules: string,
	throughTheYearsHeader: string,
	shouldOutputLinkToNotes: boolean
): string {
	// Start with a heading using the provided header; add a horizontal rule above if specified.
	let output = `## ${throughTheYearsHeader}\n`;
	if (horizontalRules.includes("Above")) {
		output = `---\n## ${throughTheYearsHeader}\n`;
	}

	// Create a base moment from the input date using the configured date format.
	const baseMoment = moment(inputDateString, dateFormat);

	// Sort the years in descending order.
	const years = Object.keys(summaries).sort(
		(a, b) => parseInt(b) - parseInt(a)
	);

	// For each year, update the base date's year, format it, and create a link.
	for (const year of years) {
		const noteMoment = baseMoment.clone().set("year", parseInt(year));
		const formattedNoteName = noteMoment.format(dateFormat);
		// Create a Markdown link in the form [[formattedNoteName|year]] if setting is on
		if (shouldOutputLinkToNotes) {
			output += `- **[[${formattedNoteName}|${year}]]:** ${summaries[year]}\n`;
		} else {
			output += `- **${year}:** ${summaries[year]}\n`;
		}
	}

	if (horizontalRules.includes("Below")) {
		output += "\n---";
	}

	return output;
}

export function buildHealthOutputBlock(
	calories: string,
	protein: string,
	carbs: string,
	fats: string,
	deficit: string
): string {
	const outputBlock = 
`\`\`\`dietEstimates
calories: ${calories}
protein: ${protein}
carbs: ${carbs}
fats: ${fats}
\`\`\``;
	return outputBlock;
}
