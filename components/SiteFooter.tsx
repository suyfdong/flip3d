import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 py-10 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-6 sm:gap-8 mb-8 text-sm">
          <div>
            <h3 className="font-semibold mb-3">Converters</h3>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
              <li><Link href="/stl-to-obj/" className="hover:text-blue-600 dark:hover:text-blue-400">STL to OBJ</Link></li>
              <li><Link href="/obj-to-stl/" className="hover:text-blue-600 dark:hover:text-blue-400">OBJ to STL</Link></li>
              <li><Link href="/stl-to-glb/" className="hover:text-blue-600 dark:hover:text-blue-400">STL to GLB</Link></li>
              <li><Link href="/glb-to-stl/" className="hover:text-blue-600 dark:hover:text-blue-400">GLB to STL</Link></li>
              <li><Link href="/stl-to-ply/" className="hover:text-blue-600 dark:hover:text-blue-400">STL to PLY</Link></li>
              <li><Link href="/ply-to-stl/" className="hover:text-blue-600 dark:hover:text-blue-400">PLY to STL</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">3D Printing</h3>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
              <li><Link href="/stl-to-3mf/" className="hover:text-blue-600 dark:hover:text-blue-400">STL to 3MF</Link></li>
              <li><Link href="/3mf-to-stl/" className="hover:text-blue-600 dark:hover:text-blue-400">3MF to STL</Link></li>
              <li>
                <Link
                  href="/tools/bambu-3mf-to-prusa/"
                  className="hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                >
                  Bambu 3MF → Prusa ⭐
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/prusa-3mf-to-bambu/"
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Prusa 3MF → Bambu
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/gcode-simulator/"
                  className="hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                >
                  G-code Simulator ⭐
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/stl-repair/"
                  className="hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                >
                  STL Repair ⭐
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">CAD</h3>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
              <li><Link href="/step-to-stl/" className="hover:text-blue-600 dark:hover:text-blue-400">STEP to STL</Link></li>
              <li><Link href="/step-to-glb/" className="hover:text-blue-600 dark:hover:text-blue-400">STEP to GLB</Link></li>
              <li><Link href="/iges-to-stl/" className="hover:text-blue-600 dark:hover:text-blue-400">IGES to STL</Link></li>
              <li><Link href="/iges-to-obj/" className="hover:text-blue-600 dark:hover:text-blue-400">IGES to OBJ</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">DCC / Game</h3>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
              <li><Link href="/fbx-to-stl/" className="hover:text-blue-600 dark:hover:text-blue-400">FBX to STL</Link></li>
              <li><Link href="/fbx-to-obj/" className="hover:text-blue-600 dark:hover:text-blue-400">FBX to OBJ</Link></li>
              <li><Link href="/fbx-to-glb/" className="hover:text-blue-600 dark:hover:text-blue-400">FBX to GLB</Link></li>
              <li><Link href="/dae-to-obj/" className="hover:text-blue-600 dark:hover:text-blue-400">DAE to OBJ</Link></li>
              <li><Link href="/embed/" className="hover:text-blue-600 dark:hover:text-blue-400 font-medium">Embed viewer →</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Viewers</h3>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
              <li><Link href="/stl-viewer/" className="hover:text-blue-600 dark:hover:text-blue-400">STL Viewer</Link></li>
              <li><Link href="/obj-viewer/" className="hover:text-blue-600 dark:hover:text-blue-400">OBJ Viewer</Link></li>
              <li><Link href="/fbx-viewer/" className="hover:text-blue-600 dark:hover:text-blue-400">FBX Viewer</Link></li>
              <li><Link href="/ply-viewer/" className="hover:text-blue-600 dark:hover:text-blue-400">PLY Viewer</Link></li>
              <li><Link href="/glb-viewer/" className="hover:text-blue-600 dark:hover:text-blue-400">GLB / glTF Viewer</Link></li>
              <li><Link href="/3mf-viewer/" className="hover:text-blue-600 dark:hover:text-blue-400">3MF Viewer</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Reference</h3>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
              <li>
                <Link
                  href="/reference/stl-vs-obj-vs-3mf/"
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  STL vs OBJ vs 3MF
                </Link>
              </li>
              <li>
                <Link
                  href="/reference/bambu-vs-prusa/"
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Bambu vs Prusa
                </Link>
              </li>
              <li>
                <Link
                  href="/reference/metal-gauge-chart/"
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Metal gauge chart
                </Link>
              </li>
              <li><Link href="/about/" className="hover:text-blue-600 dark:hover:text-blue-400">About</Link></li>
              <li><Link href="/privacy/" className="hover:text-blue-600 dark:hover:text-blue-400">Privacy</Link></li>
              <li><Link href="/terms/" className="hover:text-blue-600 dark:hover:text-blue-400">Terms</Link></li>
              <li>
                <a
                  href="https://github.com/suyfdong/flip3d"
                  target="_blank"
                  rel="noopener"
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Why Flip3D</h3>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Free, fast, 100% in your browser. No upload, no signup, no
              watermark — ever.
            </p>
          </div>
        </div>
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 flex-wrap gap-2">
          <p>© {new Date().getFullYear()} Flip3D · Built in public</p>
          <p className="font-mono">three.js · jszip · all client-side</p>
        </div>
      </div>
    </footer>
  );
}
