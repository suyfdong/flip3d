import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo uses <a> instead of <Link> to force a full page reload —
            guarantees the previous viewer's WebGL context is fully released
            even on older devices, where the React client-router transition
            could feel sluggish under memory pressure. */}
        <a href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
            F
          </div>
          <span className="font-semibold tracking-tight">Flip3D</span>
        </a>
        <nav className="hidden sm:flex items-center gap-5 text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/stl-to-obj/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            STL ↔ OBJ
          </Link>
          <Link href="/stl-to-glb/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            STL ↔ GLB
          </Link>
          <Link href="/stl-to-3mf/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            STL ↔ 3MF
          </Link>
          <a
            href="https://github.com/suyfdong/flip3d"
            target="_blank"
            rel="noopener"
            className="hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
