/**
 * Standalone receipt layout — renders without the admin sidebar.
 * This lets the receipt page be shared from both forms and transactions sections.
 */
export default function ReceiptLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
