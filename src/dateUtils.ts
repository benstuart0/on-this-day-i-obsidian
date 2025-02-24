import { moment } from "obsidian";

//
// Utility Functions
//

const acceptedDateFormats: string[] = [
	"MMMM D, YYYY", // e.g., February 6, 2025 (US)
	"MMM D, YYYY", // e.g., Feb 6, 2025 (US)
	"MM/DD/YYYY", // e.g., 02/06/2025 (US)
	"M/D/YYYY", // e.g., 2/6/2025 (US)
	"YYYY-MM-DD", // e.g., 2025-02-06 (ISO)
	"D MMMM YYYY", // e.g., 6 February 2025 (EU)
	"D MMM YYYY", // e.g., 6 Feb 2025 (EU)
	"DD/MM/YYYY", // e.g., 06/02/2025 (EU)
	"D/M/YYYY", // e.g., 6/2/2025 (EU)
	"DD-MM-YYYY", // e.g., 06-02-2025 (EU alternative)
	"D-MM-YYYY", // e.g., 6-02-2025 (less common variant)
];

// Helper function to combine the accepted formats with the custom format,
// avoiding duplicates.
function getAllFormats(customFormat: string): string[] {
	if (acceptedDateFormats.includes(customFormat)) {
		return acceptedDateFormats;
	}
	return [...acceptedDateFormats, customFormat];
}

export function isValidDateString(
	dateString: string,
	format = "MMMM D, YYYY"
): boolean {
	// Use strict parsing with the combined list of formats.
	return moment(dateString, getAllFormats(format), true).isValid();
}

export function parseDateFromString(
	dateString: string,
	format: string
): Date | null {
	const m = moment(dateString, getAllFormats(format), true);
	return m.isValid() ? m.toDate() : null;
}
