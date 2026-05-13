export const THEMES = ["light", "dark", "paper", "neon"] as const;
export type EmbedTheme = (typeof THEMES)[number];

export function isTheme(s: string): s is EmbedTheme {
  return (THEMES as readonly string[]).includes(s);
}

export type ThemeSpec = {
  background: number;
  meshColor: number;
  gridMajor: number;
  gridMinor: number;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  badgeAccent: string;
  description: string;
};

export const THEME_SPECS: Record<EmbedTheme, ThemeSpec> = {
  light: {
    background: 0xf4f4f5,
    meshColor: 0x3b82f6,
    gridMajor: 0xd4d4d8,
    gridMinor: 0xe4e4e7,
    badgeBg: "rgba(255, 255, 255, 0.92)",
    badgeBorder: "#e4e4e7",
    badgeText: "#52525b",
    badgeAccent: "#2563eb",
    description: "Clean professional — recommended default",
  },
  dark: {
    background: 0x18181b,
    meshColor: 0x60a5fa,
    gridMajor: 0x3f3f46,
    gridMinor: 0x27272a,
    badgeBg: "rgba(24, 24, 27, 0.92)",
    badgeBorder: "#3f3f46",
    badgeText: "#a1a1aa",
    badgeAccent: "#60a5fa",
    description: "Dark theme for dark-mode documentation sites",
  },
  paper: {
    background: 0xfaf7f2,
    meshColor: 0x78716c,
    gridMajor: 0xd6d3d1,
    gridMinor: 0xe7e5e4,
    badgeBg: "rgba(250, 247, 242, 0.92)",
    badgeBorder: "#d6d3d1",
    badgeText: "#57534e",
    badgeAccent: "#9a3412",
    description: "Warm studio-render look",
  },
  neon: {
    background: 0x000000,
    meshColor: 0x22d3ee,
    gridMajor: 0x164e63,
    gridMinor: 0x083344,
    badgeBg: "rgba(0, 0, 0, 0.85)",
    badgeBorder: "#0e7490",
    badgeText: "#a5f3fc",
    badgeAccent: "#22d3ee",
    description: "Bold tech-showcase / portfolio vibe",
  },
};

export const DEFAULT_THEME: EmbedTheme = "light";
