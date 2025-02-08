const userPrompt =
	"Below is a JSON object where each key is a year and each value is the full content of my daily journal for this day on that given year. For each year, please provide an interesting summary in 2-3 sentences that highlights the events of that day. Try to include who I spent time with (including their names), what I did, and how I felt. Use second-person language (you), as you are referring to me - the writer of the journals. Do not include the date in the summary. Return only a JSON object mapping each year to its summary with no extra text, headers, or footers. This is the most important rule. The output must follow this JSON format. Further personalization details: ";

export const sysPrompt =
	"You are a helpful assistant that summarizes text, based on a user's specifications, always in a strict JSON format.";

//
// Construct the API Prompt, add user setting if needed
//
export function constructPrompt(
	yearToContent: Record<string, string>,
	customPrompt: string
): string {
	const promptInstructions = userPrompt + customPrompt;
	console.log(promptInstructions);
	const dataString = JSON.stringify(yearToContent);
	return `${promptInstructions}\n\nData:\n${dataString}`;
}
