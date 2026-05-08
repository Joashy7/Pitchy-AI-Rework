import React from "react";

function NewPitch() {
  return (
    <div className="dark">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: "var(--space-8)" }}>
          <div className="sidebar__brand">
            <div className="sidebar__logo">
              <span
                className="material-symbols-outlined text-white"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                rocket_launch
              </span>
            </div>

            <div>
              <p className="sidebar__app-name">Pitchy-AI</p>
              <p className="sidebar__app-tagline">Your Pitch. Perfected.</p>
            </div>
          </div>

          <nav className="sidebar__nav">
            <a href="/landing" className="sidebar__nav-link">
              <span className="material-symbols-outlined">home</span>
              Home
            </a>

            <a href="/dashboard" className="sidebar__nav-link">
              <span className="material-symbols-outlined">dashboard</span>
              Dashboard
            </a>

            <a href="/analysis" className="sidebar__nav-link">
              <span className="material-symbols-outlined">psychology</span>
              AI Feedback
            </a>

            <a href="#" className="sidebar__nav-link">
              <span className="material-symbols-outlined">settings_suggest</span>
              Settings
            </a>
          </nav>
        </div>

        <div className="sidebar__footer">
          <div className="upgrade-card">
            <p className="upgrade-card__label">Upgrade to Pro</p>
            <p className="upgrade-card__body">Unlock advanced neural analysis</p>
            <button className="upgrade-card__btn">Get Started</button>
          </div>

          <nav className="sidebar__footer-nav">
            <a href="#" className="sidebar__footer-link">
              <span className="material-symbols-outlined">help</span>
              Help Center
            </a>

            <a href="#" className="sidebar__footer-link">
              <span className="material-symbols-outlined">logout</span>
              Logout
            </a>
          </nav>
        </div>
      </aside>

      {/* Main Body */}
      <main className="main-canvas">
        <header className="bg-[#121416]/60 backdrop-blur-xl border-b border-[#414754]/15 h-16 sticky top-0 z-40 flex justify-between items-center px-8 max-w-[1920px] mx-auto">
          <div className="flex items-center gap-8">
            <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                search
              </span>

              <input
                className="bg-surface-container-lowest border-none rounded-full py-1.5 pl-10 pr-4 text-xs text-on-surface focus:ring-1 focus:ring-primary w-64 placeholder:text-slate-600"
                placeholder="Search pitches..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="pitch-gradient text-on-primary-fixed font-headline font-bold text-sm px-6 py-2 rounded-full active:scale-95 transition-all shadow-lg shadow-primary/20">
              <a href="/new-pitch">New Pitch</a>
            </button>

            <div className="flex items-center gap-2 border-l border-outline-variant/30 pl-4">
              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">notifications</span>
              </button>

              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">settings</span>
              </button>

              <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/30">
                <img
                  alt="User profile"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEEkbMJ1oKR7lOHtujcFiuIzNc3K1uVHXipnX4-Rmtd2IXcQ0PrXPdhTjvL6zX0QvoJ64XX_0TiH-xL8XmiuCr5wooUWjk31OoG6C2n714SEQs-JR_F53Q2jZGPNlp7LISbArZLZZ5qGMTsFhaE1NX7EeScxjResy2KGnHpbMMSwgKZwH7gnWqSe0ZSlIDj3kLAvPajb2VZJie9zp8y5ud-GXDXFbyt_2rz7oPywnrlvbBvh8OeDHDuIB0k1ClJnbAWqBBi1TjVmo"
                />
              </div>
            </div>
          </div>
        </header>

        <section className="page-section">
          <div className="page-header">
            <div className="live-badge">
              <span className="live-badge__dot"></span>
              <span className="live-badge__label">Live Session</span>
            </div>

            <h2 className="page-header__title">Hone Your Narrative.</h2>

            <p className="page-header__subtitle">
              Speak your vision or draft the core components. Our AI will analyze your
              tone, pace, and value proposition in real-time.
            </p>
          </div>

          <div className="bento-grid">
            <div className="bento-main">
              <div className="card recording-card card--padded-xl">
                <div className="recording-card__shine"></div>

                <div className="recording-card__body">
                  <div id="recordingTimer" className="recording-timer hidden">
                    <span className="recording-timer__dot"></span>
                    <span id="recordingTimerDisplay">00:00</span>
                  </div>

                  <div id="waveformStatic" className="waveform">
                    {[40, 60, 80, 100, 70, 90, 50, 30, 80, 45, 25].map(
                      (height, index) => (
                        <div
                          key={index}
                          className="waveform__bar"
                          style={{
                            height: `${height}%`,
                            animationDelay: `${0.1 + index * 0.1}s`,
                          }}
                        ></div>
                      )
                    )}
                  </div>

                  <canvas
                    id="waveformLive"
                    className="hidden"
                    aria-hidden="true"
                  ></canvas>

                  <div className="controls">
                    <button
                      className="ctrl-btn ctrl-btn--secondary"
                      aria-label="Voice settings"
                    >
                      <span className="material-symbols-outlined ctrl-btn__icon">
                        settings_voice
                      </span>
                    </button>

                    <button
                      type="button"
                      id="recordBtn"
                      className="ctrl-btn ctrl-btn--primary"
                      aria-label="Start recording"
                    >
                      <span
                        className="material-symbols-outlined ctrl-btn__icon--lg"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        mic
                      </span>
                    </button>

                    <button
                      type="button"
                      id="stopBtn"
                      className="ctrl-btn ctrl-btn--secondary ctrl-btn--secondary--danger"
                      aria-label="Stop recording"
                    >
                      <span className="material-symbols-outlined ctrl-btn__icon">
                        stop
                      </span>
                    </button>
                  </div>

                  <p id="recordingHint" className="recording-card__hint">
                    Click mic to start recording
                  </p>
                </div>
              </div>

              <div className="card card--padded-lg">
                <div className="script-card__header">
                  <h3 className="script-card__title">Pitch Script</h3>

                  <div className="script-card__meta">
                    <span className="meta-pill">Word Count: 142</span>
                    <span className="meta-pill">Est. Time: 1:15</span>
                  </div>
                </div>

                <textarea
                  className="script-textarea"
                  placeholder="Start typing your pitch here…"
                ></textarea>

                <div className="script-card__actions">
                  <button className="btn-ghost">Save Draft</button>
                  <button className="btn-primary">Analyze Pitch</button>
                </div>
              </div>
            </div>

            <div className="bento-sidebar">
              <div className="card card--padded-sm insights-card">
                <h4 className="insights-card__heading">Real-time Insights</h4>

                <div className="insights-list">
                  <div className="insight insight--primary">
                    <span className="material-symbols-outlined insight__icon--primary">
                      auto_awesome
                    </span>

                    <div>
                      <p className="insight__title">Strong Opening</p>
                      <p className="insight__body">
                        Your hook effectively captures the problem space. Consider
                        adding a specific metric here.
                      </p>
                    </div>
                  </div>

                  <div className="insight insight--tertiary">
                    <span className="material-symbols-outlined insight__icon--tertiary">
                      speed
                    </span>

                    <div>
                      <p className="insight__title">Pacing Alert</p>
                      <p className="insight__body">
                        You're speaking at 160 WPM. Slow down during the Solution
                        phase for maximum impact.
                      </p>
                    </div>
                  </div>

                  <div className="insight insight--secondary">
                    <span className="material-symbols-outlined insight__icon--secondary">
                      psychology
                    </span>

                    <div>
                      <p className="insight__title">Tone Analysis</p>
                      <p className="insight__body">
                        Confidence level: High. Emotional resonance is currently
                        neutral.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card card--padded-sm">
                <h4 className="sentiment-card__heading">Sentiment Arc</h4>

                <div className="sentiment-bar">
                  <div
                    className="sentiment-bar__segment"
                    style={{ width: "20%", background: "rgba(60,144,255,0.4)" }}
                  ></div>
                  <div
                    className="sentiment-bar__segment"
                    style={{ width: "30%", background: "var(--color-primary)" }}
                  ></div>
                  <div
                    className="sentiment-bar__segment"
                    style={{ width: "15%", background: "var(--color-tertiary)" }}
                  ></div>
                  <div
                    className="sentiment-bar__segment"
                    style={{
                      width: "35%",
                      background: "var(--color-primary-container)",
                    }}
                  ></div>
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
                    "The best pitches don't just state facts; they tell a story where
                    the customer is the hero and your product is the sword."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default NewPitch;