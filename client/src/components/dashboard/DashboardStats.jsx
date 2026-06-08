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
