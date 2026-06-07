import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="bg-background text-on-background font-body">
      {/* ── Nav ── */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/60 backdrop-blur-xl shadow-2xl shadow-blue-900/20">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-6 py-4 w-full">
          {/* Brand */}
          <div className="text-2xl font-bold tracking-tighter text-slate-50 font-headline">
            Pitchy-AI
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex gap-8 items-center">
            <a href="#features" className="nav-link-active font-headline text-sm font-semibold tracking-wide transition-all duration-300">
              Features
            </a>
            <a href="#how-it-works" className="font-headline text-sm font-semibold tracking-wide text-slate-400 hover:text-slate-100 transition-all duration-300">
              How it Works
            </a>
            <a href="#" className="font-headline text-sm font-semibold tracking-wide text-slate-400 hover:text-slate-100 transition-all duration-300">
              Pricing
            </a>
            <a href="#" className="font-headline text-sm font-semibold tracking-wide text-slate-400 hover:text-slate-100 transition-all duration-300">
              AI Coaching
            </a>
          </div>

          {/* Empty space for consistency */}
          <div className="hidden md:flex gap-4 items-center">
            {/* Start Pitching button removed as requested */}
          </div>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="pt-20 min-h-screen flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md">
          {/* Logo/Branding */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black font-headline text-on-surface mb-2">
              Welcome Back
            </h1>
            <p className="text-on-surface-variant text-lg">
              Access your AI coaching dashboard.
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="flex gap-4 mb-8">
            <button className="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-surface-container-highest hover:bg-surface-container-highest/80 rounded-full font-headline font-semibold text-on-surface transition-all active:scale-95">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button className="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-surface-container-highest hover:bg-surface-container-highest/80 rounded-full font-headline font-semibold text-on-surface transition-all active:scale-95">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.474-2.237-1.664-2.237-.908 0-1.449.613-1.687 1.205-.087.216-.109.517-.109.819v5.782h-3.554s.047-9.378 0-10.353h3.554v1.468c-.009.015-.021.029-.03.043h.03v-.043c.477-.731 1.328-1.78 3.23-1.78 2.36 0 4.132 1.542 4.132 4.856v5.809zM5.337 8.855c-1.144 0-1.915-.758-1.915-1.706 0-.955.771-1.706 1.96-1.706 1.188 0 1.913.751 1.938 1.706 0 .948-.75 1.706-1.983 1.706zm1.581 11.597H3.715V9.099h3.203v11.353zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" fill="#0A66C2"/>
              </svg>
              LinkedIn
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-outline-variant/20"></div>
            <span className="text-xs font-semibold text-on-surface-variant tracking-widest">OR CONTINUE WITH</span>
            <div className="flex-1 h-px bg-outline-variant/20"></div>
          </div>

          {/* Form */}
          <form className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2 tracking-wide">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                placeholder="founder@startup.com"
                className="w-full px-4 py-3 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-on-surface tracking-wide">
                  PASSWORD
                </label>
                <a href="#" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              onClick={(e) => {
                e.preventDefault()
                navigate('/new-pitch')
              }}
              className="w-full py-3 mt-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full font-bold font-headline text-lg transition-all active:scale-95 shadow-lg shadow-blue-500/30"
            >
              Sign In
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center mt-8">
            <p className="text-on-surface-variant text-sm">
              Don't have an account?{' '}
              <a href="#" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                Sign up for free
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
