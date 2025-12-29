/**
 * Utility functions for formatting and converting data types
 */

/**
 * Convert value to string if it's an object, otherwise return string or null
 * Handles various data types and formats them into readable strings
 */
export const toStringOrNull = (value: any): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    // If it's already a string, return it (but check for "[object Object]")
    return value === "[object Object]" ? "Not specified" : value;
  }
  if (typeof value === "object") {
    // If it's an object, try to convert it to a readable string
    try {
      // If it's an array, join the values
      if (Array.isArray(value)) {
        if (value.length === 0) return null;
        return value
          .map((item) =>
            typeof item === "object" && item !== null
              ? JSON.stringify(item)
              : String(item)
          )
          .join(", ");
      }
      // If it's an object, try to extract meaningful information
      // Check if it has common warranty-related keys
      if (
        value.duration ||
        value.period ||
        (value.length && typeof value.length === "number")
      ) {
        const duration = value.duration || value.period || value.length;
        const unit = value.unit || "years";
        return `${duration} ${unit}`;
      }
      // Check for other common object patterns
      if (value.value) return String(value.value);
      if (value.text) return String(value.text);
      if (value.description) return String(value.description);
      // Otherwise, try to stringify key-value pairs
      const entries = Object.entries(value);
      if (entries.length > 0) {
        const formatted = entries
          .slice(0, 5) // Limit to first 5 entries to avoid too long strings
          .map(([key, val]) => {
            if (val === null || val === undefined) return `${key}: N/A`;
            if (typeof val === "object") {
              try {
                return `${key}: ${JSON.stringify(val)}`;
              } catch {
                return `${key}: [object]`;
              }
            }
            return `${key}: ${String(val)}`;
          })
          .join(", ");
        return formatted || "Not specified";
      }
      // Empty object
      return "Not specified";
    } catch (e) {
      // If all else fails, try JSON.stringify
      try {
        const jsonStr = JSON.stringify(value);
        // Don't return "[object Object]" - return something more meaningful
        return jsonStr === "{}" ? "Not specified" : jsonStr;
      } catch {
        return "Not specified";
      }
    }
  }
  // For other types (number, boolean, etc.), convert to string
  const str = String(value);
  return str === "[object Object]" ? "Not specified" : str;
};
