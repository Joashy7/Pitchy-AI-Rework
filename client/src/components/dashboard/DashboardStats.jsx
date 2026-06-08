/**
 * Renders one dashboard statistic card.
 *
 * Args:
 * @param {object} props - Component props.
 * @param {string} props.icon - Material Symbols icon name.
 * @param {string} props.tone - Visual tone class suffix.
 * @param {string} props.label - Statistic label.
 * @param {string|number} props.value - Statistic value.
 * @param {string} [props.suffix] - Optional value suffix.
 * @param {string} [props.badge] - Optional badge text.
 *
 * Returns:
 * @returns {JSX.Element} Dashboard statistic card.
 */
function StatsCard({
  icon,
  tone,
  label,
  value,
  suffix = "",
  badge,
}) {
  return (
    <div className="card card--padded-lg dashboard-stat-card">
      <div className="dashboard-stat-card__header">
        <div className="dashboard-stat-card__icon">
          <span className={`material-symbols-outlined dashboard-stat-card__icon--${tone}`}>
            {icon}
          </span>
        </div>

        {badge ? (
          <span className={`dashboard-stat-card__badge dashboard-stat-card__badge--${tone}`}>
            {badge}
          </span>
        ) : null}
      </div>

      <p className="dashboard-stat-card__label">{label}</p>

      <p className="dashboard-stat-card__value">
        {value}
        {suffix ? (
          <span className="dashboard-stat-card__suffix">{suffix}</span>
        ) : null}
      </p>
    </div>
  );
}

/**
 * Renders the dashboard aggregate statistics grid.
 *
 * Args:
 * @param {object} props - Component props.
 * @param {object} props.stats - Dashboard aggregate stats.
 *
 * Returns:
 * @returns {JSX.Element} Dashboard stats grid.
 */
export default function DashboardStats({ stats }) {
  const statCards = [
    {
      icon: "note_stack",
      tone: "primary",
      label: "Total Pitches",
      value: stats.totalPitches,
      badge: stats.newThisWeek > 0 ? `+${stats.newThisWeek} this week` : "No new this week",
    },
    {
      icon: "grade",
      tone: "warning",
      label: "Avg. Score",
      value: stats.avgScore,
      suffix: "/100",
      badge: stats.scoreBadge,
    },
    {
      icon: "schedule",
      tone: "primary",
      label: "Total Recording Time",
      value: stats.totalRecordingTime,
      suffix: " hrs",
    },
    {
      icon: "trending_up",
      tone: "success",
      label: "Improvement Rate",
      value: stats.improvementLabel,
      badge: stats.improvementRate,
    },
  ];

  return (
    <div className="dashboard-stats-grid">
      {statCards.map((stat) => (
        <StatsCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
