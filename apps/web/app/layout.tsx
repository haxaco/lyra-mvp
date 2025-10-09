export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="fixed top-0 left-0 right-0 h-16 backdrop-blur bg-white/70 shadow-soft flex items-center px-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-coral" />
            <span className="font-semibold">Lyra</span>
            <button className="ml-3 px-2 py-1 rounded bg-beige hover:bg-blush transition">☰</button>
          </div>
          <div className="mx-auto w-full max-w-xl">
            <input placeholder="Search playlists, songs, moods…" className="w-full rounded-full px-4 py-2 bg-offwhite border border-transparent focus:border-blush outline-none" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="px-3 py-2 rounded-xl bg-coral text-white">Generate</button>
            <button aria-label="Notifications">🔔</button>
            <button aria-label="Theme">🌗</button>
            <div className="w-8 h-8 rounded-full bg-charcoal/20" />
          </div>
        </div>
        <div className="pt-16 pb-24">{children}</div>
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-r from-blush to-nude shadow-soft flex items-center px-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-offwhite/60" />
            <div>
              <div className="text-sm font-medium">Track Title</div>
              <div className="text-xs opacity-70">Now Playing</div>
            </div>
          </div>
          <div className="mx-auto flex items-center gap-3">
            <button>⏮</button>
            <button className="text-xl">⏯</button>
            <button>⏭</button>
            <div className="w-64 h-1 bg-offwhite/50 rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-charcoal/60" />
            </div>
          </div>
          <div className="ml-auto">🔊</div>
        </div>
      </body>
    </html>
  )
}
