import { Link } from "react-router-dom";

import MarketingTopBar from "../components/layout/MarketingTopBar";

const FEATURES = [
  {
    icon: "visibility",
    label: "Clarity",
    accent: "primary",
    desc: "Evaluation of jargon-free communication and core concept simplicity.",
  },
  {
    icon: "bolt",
    label: "Persuasiveness",
    accent: "tertiary",
    desc: "Analyzing emotional resonance and the strength of your call-to-action.",
  },
  {
    icon: "account_tree",
    label: "Structure",
    accent: "primary",
    desc: "Assessment of narrative flow and logical sequence of deck sections.",
  },
  {
    icon: "psychology",
    label: "Problem Definition",
    accent: "tertiary",
    desc: "How clearly you articulate the pain point your startup solves.",
  },
  {
    icon: "diamond",
    label: "Solution Strength",
    accent: "primary",
    desc: "Verifying the uniqueness and scalability of your proposed fix.",
  },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Record",
    desc: "Upload your pitch as text or record your delivery directly in the browser with studio-quality audio capture.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC9CGoV4Ui31o0sDFQS1rhq75Co844UiiCl36FRHxbhJtvF5PnVwqXqXzawi9xEkZVOjCXt9ZzGvEUpJuymjnm3y4D53RhhHhDZOT6BewewFNeVQQQw15kCzbsr5j5xhZ-riQIQ8aE47aywC1r57rSho9Ccfszb2bm-fcqj-8UIwWUf6K-nZ69KFQjvbqo4DB7vPtQfB9XtQj5mqPIkjHmQddYBZR3852DCzcc5FppwBgtrQb9DrDBGAoJioNyrU89kEcrq-MEfZkM",
    alt: "Professional condenser microphone in a dark studio setting",
  },
  {
    step: "02",
    title: "Analyze",
    desc: "Gemini AI reviews your narrative while specialized voice models detect tone, pace, and filler word frequency.",
    img: "https://thumbs.dreamstime.com/b/abstract-blue-digital-network-mesh-glowing-nodes-data-connections-technology-cybersecurity-background-highly-445915836.jpg",
    alt: "Abstract visualization of neural network pathways with glowing blue nodes",
  },
  {
    step: "03",
    title: "Improve",
    desc: "Get specific rewrite suggestions and audio versions of your pitch performed by AI voices from ElevenLabs for imitation.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDlubZvyCcX3iikwi6deVXVSEQm3I4yhGq08b9LqAJkz5GBm3Et7oZsvELUrNArrLtTESOqdAuVT2Lofp_aJd2z3QOFXfnOPx7DN0Kck2dS4wyMYDX1WMvf-tJOrX0ZAsKePqH-4ueuYDT0otMK1vhILFQk94CjoNWHbjQIOegrmlIMEcqkeGThbeIc9Gbxt_qnQ63F169qqTMGIvIKI7i_ORdmCfoC1lZMZ-P7ScU5DQdb_sOx9ykIZ0o9bLawq1xkoO6qfN6VOkI",
    alt: "Clean financial data chart on a monitor in a minimalist dark office",
  },
];

const STATS = [
  { value: "98%", label: "Confidence Lift" },
  { value: "12k+", label: "Pitches Analyzed" },
  { value: "24/7", label: "Coach Availability" },
  { value: "4.9/5", label: "Founder Rating" },
];

/**
 * Renders the marketing landing page for Pitchy-AI.
 *
 * Args:
 * None.
 *
 * Returns:
 * @returns {JSX.Element} Landing page with hero, features, workflow, and calls to action.
 */
function LandingPage() {
  return (
    <div className="bg-background text-on-background font-body">
      <MarketingTopBar />

      <main className="pt-20">
        <section className="relative min-h-[760px] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
          <div className="relative z-10 max-w-5xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/20 text-primary text-xs font-bold tracking-[0.2em] mb-8 font-headline">
              AI-POWERED PERFORMANCE COACH
            </span>

            <h1 className="text-6xl md:text-8xl font-black font-headline tracking-tighter leading-[0.9] text-on-surface mb-8">
              Master Your Pitch <br />
              <span className="text-primary-fixed-dim">in Seconds</span>
            </h1>

            <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-12 font-light leading-relaxed">
              Powered by <span className="text-white font-semibold">Gemini AI</span> for deep narrative
              analysis and <span className="text-white font-semibold">ElevenLabs</span> for high-fidelity
              audio feedback. Record, analyze, and refine your delivery with clinical precision.
            </p>

            <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
              <Link
                to="/new-pitch"
                className="w-full md:w-auto px-10 py-5 btn-primary text-on-primary-container rounded-xl font-bold font-headline text-lg shadow-xl shadow-primary/20"
              >
                Get Started Free
              </Link>
              <a
                href="#how-it-works"
                className="w-full md:w-auto px-10 py-5 bg-surface-container-highest text-on-surface rounded-xl font-bold font-headline text-lg hover:bg-surface-bright transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">play_circle</span>
                See How It Works
              </a>
            </div>
          </div>
        </section>

        <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="mb-20 text-left md:flex justify-between items-end">
            <div className="max-w-xl">
              <h2 className="text-4xl font-headline font-extrabold tracking-tight mb-4 text-on-surface">
                Precision Scoring
              </h2>
              <p className="text-on-surface-variant text-lg">
                Our AI engine decomposes your pitch into critical dimensions to provide
                actionable, granular improvements.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {FEATURES.map(({ icon, label, accent, desc }) => (
              <div
                key={label}
                className={`bg-surface-container-low p-8 rounded-lg card-accent-${accent} hover:bg-surface-container transition-colors group`}
              >
                <span className={`material-symbols-outlined text-${accent} mb-6 text-3xl group-hover:scale-110 transition-transform block`}>
                  {icon}
                </span>
                <h3 className="font-headline font-bold text-xl mb-3 text-on-surface">{label}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="py-32 bg-surface-container-lowest relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <h2 className="text-4xl md:text-5xl font-headline font-black text-center mb-24 text-on-surface">
              Performance Workflow
            </h2>

            <div className="flex flex-col md:flex-row items-start justify-between gap-12">
              {WORKFLOW_STEPS.map(({ step, title, desc, img, alt }, index) => (
                <div key={step} className="flex flex-1 items-start gap-12">
                  <div className="flex-1 relative">
                    <div className="mb-8 w-16 h-16 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary font-headline font-black text-2xl shadow-xl border border-outline-variant/10">
                      {step}
                    </div>
                    <h4 className="text-2xl font-bold font-headline mb-4 text-on-surface">{title}</h4>
                    <p className="text-on-surface-variant mb-8">{desc}</p>
                    <div className="rounded-lg overflow-hidden bg-background p-4 border border-outline-variant/5">
                      <img className="workflow-image" src={img} alt={alt} />
                    </div>
                  </div>
                  {index < WORKFLOW_STEPS.length - 1 ? (
                    <div className="hidden md:block pt-8 text-outline-variant/30">
                      <span className="material-symbols-outlined text-5xl">trending_flat</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-40 px-6 relative">
          <div className="max-w-4xl mx-auto glass-panel p-16 rounded-lg border border-outline-variant/20 text-center relative overflow-hidden">
            <div className="cta-glow" />

            <h2 className="text-5xl font-headline font-black mb-6 text-on-surface">Ready to Raise?</h2>
            <p className="text-xl text-on-surface-variant mb-12 max-w-xl mx-auto">
              Join 1,200+ founders who have used Pitchy-AI to secure over $450M in
              seed and Series A funding.
            </p>

            <Link
              to="/new-pitch"
              className="inline-block btn-primary text-on-primary-container px-12 py-5 rounded-xl font-bold text-xl font-headline"
            >
              Launch Your Success Story
            </Link>

            <div className="mt-16 pt-16 border-t border-outline-variant/10 grid grid-cols-2 md:grid-cols-4 gap-8">
              {STATS.map(({ value, label }) => (
                <div key={label}>
                  <div className="text-3xl font-black text-on-surface font-headline">{value}</div>
                  <div className="text-sm text-on-surface-variant uppercase tracking-widest mt-2">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-slate-800/50 bg-slate-900 dark:bg-slate-950">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 py-12 max-w-7xl mx-auto">
          <div className="mb-8 md:mb-0">
            <div className="text-lg font-black text-slate-300 font-headline mb-2">Pitchy-AI</div>
            <p className="font-body text-xs leading-relaxed text-slate-500 max-w-xs">
              (c) 2024 Pitchy-AI. Master your narrative.
              The premier tool for elite founder performance.
            </p>
          </div>

          <div className="flex flex-wrap gap-8 justify-center items-center">
            <Link to="/dashboard" className="font-body text-xs text-slate-500 hover:text-blue-400 transition-colors">
              Dashboard
            </Link>
            <Link to="/new-pitch" className="font-body text-xs text-slate-500 hover:text-blue-400 transition-colors">
              New Pitch
            </Link>
            <Link to="/login" className="font-body text-xs text-slate-500 hover:text-blue-400 transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="font-body text-xs text-slate-500 hover:text-blue-400 transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
