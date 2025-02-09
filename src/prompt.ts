const userPrompt = `Below is a JSON object where each key is a year and each value is the full 
	content of my daily journal for this day on that given year. For each year, 
	please provide an interesting summary in 2-3 sentences that highlights the events 
	of that day. Try to include who I spent time with (including their names), what I did, 
	and how I felt. Use second-person language (you), as you are referring to me - 
	the writer of the journals. Do not include the date in the summary. 
	Return only a JSON object mapping each year to its summary with no extra text, 
	headers, or footers. This is the most important rule. The output must follow this JSON format. 
	Further personalization details: `;

export const sysPrompt = `You are a helpful assistant that summarizes text, 
	based on a user's specifications, always in a strict JSON format.`;

//
// Construct the API Prompt, add user setting if needed
//
export function constructPrompt(
	yearToContent: Record<string, string>,
	customPrompt: string
): string {
	const promptInstructions = userPrompt + customPrompt;
	const dataString = JSON.stringify(yearToContent);
	return `${promptInstructions}\n\nData:\n${dataString}`;
}

export function constructDietPrompt(foodInfo: string): string {
	const prompt = `You are a health assistant. Based on the following food details extracted from a daily journal,
	provide an estimated nutritional analysis.
		
	Food Information:
	${foodInfo}
	
	Provide the output in JSON format with the following keys:
	- calories: estimated total calories consumed,
	- protein: estimated grams of protein,
	- carbs: estimated grams of carbohydrates,
	- fats: estimated grams of fats,

	Return only a JSON object with these keys, with no additional text. Include units in the JSON values.`;
	return prompt;
}
