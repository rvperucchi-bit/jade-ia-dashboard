/**
 * Sanitize AI markdown output for display in React Native Text components.
 * - ## / ### headers → remove hashes, keep text
 * - **bold** → remove asterisks (plain text; use MarkdownText component for actual bold)
 * - * item / - item at line start → • bullet
 * - --- → visual separator line
 * - `code` → remove backticks
 * - collapses 3+ newlines to 2
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/gs, "$1")
    .replace(/^[\*\-]\s+/gm, "• ")
    .replace(/^---+$/gm, "───────────────")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
