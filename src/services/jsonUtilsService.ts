export const jsonUtilsService = {
  safeJsonParse<T>(jsonString: string | null | undefined, fallback: T): T {
    if (!jsonString?.trim()) return fallback;
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('Error parsing JSON:', jsonString, error);
      return fallback;
    }
  },

  safeJsonStringify(obj: unknown): string {
    try {
      return JSON.stringify(obj);
    } catch (error) {
      console.warn('Error stringifying JSON:', obj, error);
      return '{}';
    }
  },
};
