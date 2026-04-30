/**
 * Format phone number to (888) 888-8888 format
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');

  // Don't format if empty
  if (!numbers) return '';

  // Format based on length
  if (numbers.length <= 3) {
    return `(${numbers}`;
  } else if (numbers.length <= 6) {
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
  } else {
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  }
}

/**
 * Hook for phone number input formatting
 */
export function usePhoneInput(initialValue: string = '') {
  return {
    value: initialValue,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value);
      e.target.value = formatted;
      return formatted;
    },
  };
}

/**
 * Clean phone number for storage (remove formatting)
 */
export function cleanPhoneNumber(formatted: string): string {
  return formatted.replace(/\D/g, '');
}
