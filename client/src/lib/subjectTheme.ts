/**
 * Subject Theme Engine
 * Maps a class subject name to a visual theme + available toolbox tools.
 */

export type SubjectKey =
  | "cs"
  | "math"
  | "physics"
  | "chemistry"
  | "biology"
  | "english"
  | "arabic"
  | "social"
  | "default";

export interface SubjectTheme {
  key: SubjectKey;
  label: string;
  /** Primary accent color (Tailwind-compatible hex) */
  color: string;
  /** Gradient for hero / card headers */
  gradient: string;
  /** Background pattern CSS (SVG data-uri or CSS pattern) */
  bgPattern: string;
  /** Emoji icon */
  emoji: string;
  /** Tailwind text color class for the accent */
  textClass: string;
  /** Tailwind bg color class (light) */
  bgClass: string;
  /** Tailwind border color class */
  borderClass: string;
  /** Tools available in the toolbox */
  tools: ToolDef[];
}

export interface ToolDef {
  id: string;
  label: string;
  icon: string; // emoji
  description: string;
}

// ─── Tool definitions ────────────────────────────────────────────────────────

const PYTHON_LAB: ToolDef = {
  id: "coding",
  label: "Coding",
  icon: "🐍",
  description: "Write and run Python code in the browser",
};
const GEOGEBRA: ToolDef = {
  id: "geogebra",
  label: "GeoGebra",
  icon: "📐",
  description: "Interactive graphing calculator and geometry tool",
};
const CALCULATOR: ToolDef = {
  id: "calculator",
  label: "Scientific Calculator",
  icon: "🧮",
  description: "Advanced calculator with scientific functions",
};
const LATEX: ToolDef = {
  id: "latex",
  label: "Formula Renderer",
  icon: "∑",
  description: "Render mathematical formulas using LaTeX",
};
const PERIODIC_TABLE: ToolDef = {
  id: "periodic-table",
  label: "Periodic Table",
  icon: "⚗️",
  description: "Interactive periodic table of elements",
};
const BIOLOGY_CELL: ToolDef = {
  id: "biology-cell",
  label: "3D Cell Diagram",
  icon: "🔬",
  description: "Interactive 3D cell with clickable organelles",
};
const READING_NOTES: ToolDef = {
  id: "reading-notes",
  label: "Reading + Notes",
  icon: "📖",
  description: "Read passages and add sticky notes",
};
const WORLD_MAP: ToolDef = {
  id: "world-map",
  label: "World Map",
  icon: "🗺️",
  description: "Interactive world map for geography",
};
const TIMELINE: ToolDef = {
  id: "timeline",
  label: "Timeline Builder",
  icon: "📅",
  description: "Build and view historical timelines",
};
const AI_TUTOR: ToolDef = {
  id: "ai-tutor",
  label: "AI Tutor",
  icon: "🤖",
  description: "Ask the AI tutor anything about this subject",
};

// ─── Theme map ───────────────────────────────────────────────────────────────

const THEMES: Record<SubjectKey, SubjectTheme> = {
  cs: {
    key: "cs",
    label: "Computer Science",
    color: "#22c55e",
    gradient: "from-green-600 to-emerald-500",
    bgPattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    emoji: "💻",
    textClass: "text-green-600",
    bgClass: "bg-green-50 dark:bg-green-950/30",
    borderClass: "border-green-200 dark:border-green-800",
    tools: [PYTHON_LAB, AI_TUTOR],
  },
  math: {
    key: "math",
    label: "Mathematics",
    color: "#3b82f6",
    gradient: "from-blue-600 to-indigo-500",
    bgPattern: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%233b82f6' fill-opacity='0.05'%3E%3Cpath d='M0 0h40v40H0V0zm40 40h40v40H40V40zm0-40h2l-2 2V0zm0 4l4-4h2l-6 6V4zm0 4l8-8h2L40 10V8zm0 4L52 0h2L40 14v-2zm0 4L56 0h2L40 18v-2zm0 4L60 0h2L40 22v-2zm0 4L64 0h2L40 26v-2zm0 4L68 0h2L40 30v-2zm0 4L72 0h2L40 34v-2zm0 4L76 0h2l-2 2-34 34v-2zm4 4L80 0h2L44 42l-4-4zm4 4L80 4h2L48 46l-4-4zm4 4L80 8h2L52 50l-4-4zm4 4L80 12h2L56 54l-4-4zm4 4L80 16h2L60 58l-4-4zm4 4L80 20h2L64 62l-4-4zm4 4L80 24h2L68 66l-4-4zm4 4L80 28h2L72 70l-4-4zm4 4L80 32h2L76 74l-4-4zm4 4L80 36h2L80 40l-4-4zm4 4L80 40h2v2l-6-2zm4 4v-4l4 4h-4zm0 4v-4l8 4h-8zm0 4v-4l12 4h-12zm0 4v-4l16 4h-16zm0 4v-4l20 4h-20zm0 4v-4l24 4h-24zm0 4v-4l28 4h-28zm0 4v-4l32 4h-32zm0 4v-4l36 4h-36zm0 4v-4l40 4H40z'/%3E%3C/g%3E%3C/svg%3E")`,
    emoji: "📐",
    textClass: "text-blue-600",
    bgClass: "bg-blue-50 dark:bg-blue-950/30",
    borderClass: "border-blue-200 dark:border-blue-800",
    tools: [CALCULATOR, GEOGEBRA, PYTHON_LAB, AI_TUTOR],
  },
  physics: {
    key: "physics",
    label: "Physics",
    color: "#f97316",
    gradient: "from-orange-500 to-amber-500",
    bgPattern: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%23f97316' stroke-opacity='0.07' stroke-width='1'/%3E%3Ccircle cx='50' cy='50' r='25' fill='none' stroke='%23f97316' stroke-opacity='0.07' stroke-width='1'/%3E%3Ccircle cx='50' cy='50' r='10' fill='none' stroke='%23f97316' stroke-opacity='0.07' stroke-width='1'/%3E%3C/svg%3E")`,
    emoji: "⚡",
    textClass: "text-orange-600",
    bgClass: "bg-orange-50 dark:bg-orange-950/30",
    borderClass: "border-orange-200 dark:border-orange-800",
    tools: [CALCULATOR, GEOGEBRA, PYTHON_LAB, AI_TUTOR],
  },
  chemistry: {
    key: "chemistry",
    label: "Chemistry",
    color: "#a855f7",
    gradient: "from-purple-600 to-violet-500",
    bgPattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23a855f7' fill-opacity='0.06'%3E%3Ccircle cx='10' cy='10' r='4'/%3E%3Ccircle cx='30' cy='10' r='4'/%3E%3Ccircle cx='50' cy='10' r='4'/%3E%3Ccircle cx='20' cy='28' r='4'/%3E%3Ccircle cx='40' cy='28' r='4'/%3E%3Ccircle cx='10' cy='46' r='4'/%3E%3Ccircle cx='30' cy='46' r='4'/%3E%3Ccircle cx='50' cy='46' r='4'/%3E%3C/g%3E%3C/svg%3E")`,
    emoji: "⚗️",
    textClass: "text-purple-600",
    bgClass: "bg-purple-50 dark:bg-purple-950/30",
    borderClass: "border-purple-200 dark:border-purple-800",
    tools: [PERIODIC_TABLE, PYTHON_LAB, AI_TUTOR],
  },
  biology: {
    key: "biology",
    label: "Biology",
    color: "#14b8a6",
    gradient: "from-teal-600 to-cyan-500",
    bgPattern: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cellipse cx='40' cy='40' rx='30' ry='18' fill='none' stroke='%2314b8a6' stroke-opacity='0.08' stroke-width='1.5'/%3E%3Cellipse cx='40' cy='40' rx='18' ry='30' fill='none' stroke='%2314b8a6' stroke-opacity='0.08' stroke-width='1.5'/%3E%3Ccircle cx='40' cy='40' r='5' fill='%2314b8a6' fill-opacity='0.08'/%3E%3C/svg%3E")`,
    emoji: "🔬",
    textClass: "text-teal-600",
    bgClass: "bg-teal-50 dark:bg-teal-950/30",
    borderClass: "border-teal-200 dark:border-teal-800",
    tools: [BIOLOGY_CELL, AI_TUTOR],
  },
  english: {
    key: "english",
    label: "English",
    color: "#f59e0b",
    gradient: "from-amber-500 to-yellow-500",
    bgPattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f59e0b' fill-opacity='0.06'%3E%3Cpath d='M10 10h4v2h-4zm8 0h4v2h-4zm8 0h4v2h-4zm8 0h4v2h-4zm8 0h4v2h-4zM10 18h4v2h-4zm8 0h4v2h-4zm8 0h4v2h-4zm8 0h4v2h-4zm8 0h4v2h-4zM10 26h4v2h-4zm8 0h4v2h-4zm8 0h4v2h-4zm8 0h4v2h-4zm8 0h4v2h-4zM10 34h4v2h-4zm8 0h4v2h-4zm8 0h4v2h-4zm8 0h4v2h-4zm8 0h4v2h-4zM10 42h4v2h-4zm8 0h4v2h-4zm8 0h4v2h-4zm8 0h4v2h-4zm8 0h4v2h-4z'/%3E%3C/g%3E%3C/svg%3E")`,
    emoji: "📚",
    textClass: "text-amber-600",
    bgClass: "bg-amber-50 dark:bg-amber-950/30",
    borderClass: "border-amber-200 dark:border-amber-800",
    tools: [READING_NOTES, AI_TUTOR],
  },
  arabic: {
    key: "arabic",
    label: "Arabic",
    color: "#ef4444",
    gradient: "from-red-600 to-rose-500",
    bgPattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ef4444' fill-opacity='0.06'%3E%3Cpath d='M30 5 L55 30 L30 55 L5 30 Z' fill='none' stroke='%23ef4444' stroke-opacity='0.08' stroke-width='1'/%3E%3Cpath d='M30 15 L45 30 L30 45 L15 30 Z' fill='none' stroke='%23ef4444' stroke-opacity='0.08' stroke-width='1'/%3E%3C/g%3E%3C/svg%3E")`,
    emoji: "🌙",
    textClass: "text-red-600",
    bgClass: "bg-red-50 dark:bg-red-950/30",
    borderClass: "border-red-200 dark:border-red-800",
    tools: [READING_NOTES, AI_TUTOR],
  },
  social: {
    key: "social",
    label: "Social Studies",
    color: "#78716c",
    gradient: "from-stone-600 to-amber-700",
    bgPattern: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2378716c' fill-opacity='0.06'%3E%3Crect x='0' y='0' width='40' height='40' rx='2'/%3E%3Crect x='40' y='40' width='40' height='40' rx='2'/%3E%3C/g%3E%3C/svg%3E")`,
    emoji: "🌍",
    textClass: "text-stone-600",
    bgClass: "bg-stone-50 dark:bg-stone-950/30",
    borderClass: "border-stone-200 dark:border-stone-800",
    tools: [WORLD_MAP, TIMELINE, AI_TUTOR],
  },
  default: {
    key: "default",
    label: "General",
    color: "#6366f1",
    gradient: "from-indigo-600 to-purple-500",
    bgPattern: "none",
    emoji: "📋",
    textClass: "text-indigo-600",
    bgClass: "bg-indigo-50 dark:bg-indigo-950/30",
    borderClass: "border-indigo-200 dark:border-indigo-800",
    tools: [AI_TUTOR],
  },
};

// ─── Detection logic ─────────────────────────────────────────────────────────

const KEYWORD_MAP: [SubjectKey, string[]][] = [
  ["cs", ["computer", "cs", "python", "coding", "programming", "software", "ict", "technology", "tech"]],
  ["math", ["math", "algebra", "geometry", "calculus", "arithmetic", "statistics", "trigonometry", "رياضيات"]],
  ["physics", ["physics", "فيزياء", "mechanics", "electro", "optics", "thermodynamics"]],
  ["chemistry", ["chemistry", "كيمياء", "chem", "organic", "inorganic", "biochem"]],
  ["biology", ["biology", "bio", "أحياء", "ecology", "cell", "genetics", "anatomy", "organism"]],
  ["english", ["english", "literature", "writing", "grammar", "reading", "esl", "efl"]],
  ["arabic", ["arabic", "عربي", "عربية", "لغة عربية", "نحو", "أدب"]],
  ["social", ["social", "history", "geography", "civics", "economics", "تاريخ", "جغرافيا", "اجتماعيات"]],
];

export function detectSubjectKey(subjectName: string): SubjectKey {
  const lower = subjectName.toLowerCase();
  for (const [key, keywords] of KEYWORD_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) return key;
  }
  return "default";
}

export function getSubjectTheme(subjectName: string): SubjectTheme {
  const key = detectSubjectKey(subjectName);
  return THEMES[key];
}

export { THEMES };
