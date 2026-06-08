const PROFILE_IMAGE_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCEEkbMJ1oKR7lOHtujcFiuIzNc3K1uVHXipnX4-Rmtd2IXcQ0PrXPdhTjvL6zX0QvoJ64XX_0TiH-xL8XmiuCr5wooUWjk31OoG6C2n714SEQs-JR_F53Q2jZGPNlp7LISbArZLZZ5qGMTsFhaE1NX7EeScxjResy2KGnHpbMMSwgKZwH7gnWqSe0ZSlIDj3kLAvPajb2VZJie9zp8y5ud-GXDXFbyt_2rz7oPywnrlvbBvh8OeDHDuIB0k1ClJnbAWqBBi1TjVmo";

function TopBar({ searchValue, onSearchChange }) {
  const searchProps =
    searchValue === undefined
      ? {}
      : {
          value: searchValue,
          onChange: onSearchChange,
        };

  return (
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
            {...searchProps}
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
              src={PROFILE_IMAGE_URL}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
