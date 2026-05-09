// ─── Badge Definitions ────────────────────────────────────────────────────────
// Badges are computed from total points — no extra DB table needed.

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  threshold: number; // minimum total points to earn this badge
  color: string; // Tailwind bg color class
  textColor: string; // Tailwind text color class
}

export const BADGES: Badge[] = [
  {
    id: "first_point",
    name: "First Step",
    description: "Earned your first point",
    emoji: "⭐",
    threshold: 1,
    color: "bg-yellow-100 dark:bg-yellow-900/30",
    textColor: "text-yellow-700 dark:text-yellow-300",
  },
  {
    id: "rising_star",
    name: "Rising Star",
    description: "Reached 10 points",
    emoji: "🌟",
    threshold: 10,
    color: "bg-amber-100 dark:bg-amber-900/30",
    textColor: "text-amber-700 dark:text-amber-300",
  },
  {
    id: "good_student",
    name: "Good Student",
    description: "Reached 25 points",
    emoji: "📚",
    threshold: 25,
    color: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-700 dark:text-blue-300",
  },
  {
    id: "class_hero",
    name: "Class Hero",
    description: "Reached 50 points",
    emoji: "🦸",
    threshold: 50,
    color: "bg-purple-100 dark:bg-purple-900/30",
    textColor: "text-purple-700 dark:text-purple-300",
  },
  {
    id: "scholar",
    name: "Scholar",
    description: "Reached 100 points",
    emoji: "🎓",
    threshold: 100,
    color: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-700 dark:text-green-300",
  },
  {
    id: "champion",
    name: "Class Champion",
    description: "Reached 200 points",
    emoji: "🏆",
    threshold: 200,
    color: "bg-orange-100 dark:bg-orange-900/30",
    textColor: "text-orange-700 dark:text-orange-300",
  },
  {
    id: "legend",
    name: "Legend",
    description: "Reached 500 points — truly exceptional",
    emoji: "👑",
    threshold: 500,
    color: "bg-rose-100 dark:bg-rose-900/30",
    textColor: "text-rose-700 dark:text-rose-300",
  },
];

/** Returns all badges the student has earned based on their total points */
export function getEarnedBadges(totalPoints: number): Badge[] {
  return BADGES.filter((b) => totalPoints >= b.threshold);
}

/** Returns the next badge the student hasn't earned yet */
export function getNextBadge(totalPoints: number): Badge | null {
  return BADGES.find((b) => totalPoints < b.threshold) ?? null;
}

/** Returns progress toward the next badge as a 0–100 percentage */
export function getNextBadgeProgress(totalPoints: number): number {
  const next = getNextBadge(totalPoints);
  if (!next) return 100;
  const prev = BADGES.slice().reverse().find((b) => totalPoints >= b.threshold);
  const from = prev?.threshold ?? 0;
  const to = next.threshold;
  return Math.round(((totalPoints - from) / (to - from)) * 100);
}
