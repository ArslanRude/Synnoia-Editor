export interface CompletionOptions {
  suggestion: (prefixText: string, suffixText: string) => Promise<string>
}
