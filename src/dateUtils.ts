import moment from "moment";

//
// Utility Functions
//

// Check if a string matches the expected date format ("MMMM D, YYYY")
export function isValidDateString(dateString: string): boolean {
	const regex = /^(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}$/;
	return regex.test(dateString);
}

export function parseDateFromString(
	dateString: string,
	format: string
): Date | null {
	// Create an array of formats that includes the provided one plus several common alternatives.
	const formats = [
		format, // Use the provided format from settings first
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

	// Use strict parsing to ensure accuracy.
	const m = moment(dateString, formats, true);

	if (m.isValid()) {
		return m.toDate();
	}
	return null;
}
