/**
 * Renders a status message when message content exists.
 *
 * Args:
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Message content to display.
 * @param {string} [props.tone] - Visual tone such as "info" or "error".
 *
 * Returns:
 * @returns {JSX.Element|null} Status message element, or null when children is empty.
 */
export default function StatusMessage({ children, tone = "info" }) {
  if (!children) return null;

  return (
    <div role="status" className={`status-message status-message--${tone}`}>
      {children}
    </div>
  );
}
