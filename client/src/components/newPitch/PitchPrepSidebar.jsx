const PREP_ITEMS = [
  {
    tone: "primary",
    icon: "auto_awesome",
    title: "Start With a Hook",
    body: "Open with the problem, audience, or moment that makes the pitch worth hearing.",
  },
  {
    tone: "tertiary",
    icon: "speed",
    title: "Watch Your Pacing",
    body: "Give important claims room to land before moving into the next section.",
  },
  {
    tone: "secondary",
    icon: "psychology",
    title: "Make the Ask Clear",
    body: "End with the action, decision, or next step you want from the listener.",
  },
];

const PITCH_ARC_SEGMENTS = [
  {
    width: "20%",
    color: "rgba(60, 144, 255, 0.4)",
  },
  {
    width: "30%",
    color: "var(--color-primary)",
  },
  {
    width: "15%",
    color: "var(--color-tertiary)",
  },
  {
    width: "35%",
    color: "var(--color-primary-container)",
  },
];

export default function PitchPrepSidebar() {
  return (
    <div className="bento-sidebar">
      <div className="card card--padded-sm insights-card">
        <h4 className="insights-card__heading">Pitching Checklist</h4>

        <div className="insights-list">
          {PREP_ITEMS.map((item) => (
            <div key={item.title} className={`insight insight--${item.tone}`}>
              <span className={`material-symbols-outlined insight__icon--${item.tone}`}>
                {item.icon}
              </span>

              <div>
                <p className="insight__title">{item.title}</p>
                <p className="insight__body">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card card--padded-sm">
        <h4 className="sentiment-card__heading">Pitch Arc</h4>

        <div className="sentiment-bar">
          {PITCH_ARC_SEGMENTS.map((segment, index) => (
            <div
              key={`${segment.width}-${index}`}
              className="sentiment-bar__segment"
              style={{
                "--segment-width": segment.width,
                "--segment-color": segment.color,
              }}
            />
          ))}
        </div>

        <div className="sentiment-bar__labels">
          <span className="sentiment-bar__label">Problem</span>
          <span className="sentiment-bar__label">Solution</span>
          <span className="sentiment-bar__label">Call to Action</span>
        </div>
      </div>

      <div className="pro-tip-card">
        <img
          className="pro-tip-card__bg"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtYeE32SaV-fsXsudAa27v163HqFE1LEq92lN681UgyqxzGiaKZ1neS_JJik-Hn2hheVhqx0vwsn77Ep_56OZOiHbG9fJji2dCdKz4tDxuesIsQrY5Y6UH-kkCF7Db_wcRIFo1HpqZdvOuuTFTTCVLb51Hy4UKdVG_CqJWFELJjkUcmeoU0s4dhvhgRzn0dt6H2oY6y2HdMGj4q1E4qk0iA_gop2lL940jgYGL74-N-oY5Pij6hyyyQfl0KJYlo9e0X_4B7Usd1HQ"
          alt="Modern tech hub at dusk"
        />

        <div className="pro-tip-card__overlay"></div>

        <div className="pro-tip-card__content">
          <div className="pro-tip-card__label-row">
            <span className="material-symbols-outlined pro-tip-card__label-icon">
              lightbulb
            </span>
            <span className="pro-tip-card__label">Pro Tip</span>
          </div>

          <p className="pro-tip-card__quote">
            "The best pitches do not just state facts; they tell a story where
            the customer is the hero and your product is the sword."
          </p>
        </div>
      </div>
    </div>
  );
}
