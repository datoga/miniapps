export type Messages = Record<string, unknown>;

/**
 * Deep merge two message objects
 */
function deepMerge(target: Messages, source: Messages): Messages {
  const result = { ...target };
  
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(
        (result[key] as Messages) || {},
        source[key] as Messages
      );
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * Merge common messages with app-specific messages
 */
export function mergeMessages(common: Messages, app: Messages): Messages {
  return deepMerge(common, app);
}

