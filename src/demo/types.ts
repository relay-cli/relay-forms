export interface DemoProps {
  /** Read keys. A snapshot renders the first screen without waiting. */
  interactive?: boolean;
  onSubmit?: (answers: Record<string, unknown>) => void;
  onCancel?: () => void;
}
