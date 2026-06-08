export default function StatusMessage({ children, tone = "info" }) {
  if (!children) return null;

  return (
    <div role="status" className={`status-message status-message--${tone}`}>
      {children}
    </div>
  );
}
