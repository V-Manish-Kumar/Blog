"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { GitBranch, Info } from "lucide-react";
import { useRouter } from "next/navigation";

type GitHubGridProps = {
  initialActivity?: Record<string, number>;
};

function getLevel(count: number) {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

export default function GitHubGrid({ initialActivity = {} }: GitHubGridProps) {
  const router = useRouter();
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number } | null>(null);
  const [activity, setActivity] = useState<Record<string, number>>(initialActivity);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch live activity on mount
    fetch("/api/activity")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setActivity(data);
        }
      })
      .catch((err) => console.error("Error fetching activity:", err));
  }, []);

  // Generate 53 weeks of activity
  const gridData = useMemo(() => {
    // Generate a deterministic grid using the activity map.
    const data = [];
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 365);
    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDay);
    const tempDate = new Date(startDate);

    while (tempDate <= now) {
      const year = tempDate.getFullYear();
      const month = String(tempDate.getMonth() + 1).padStart(2, '0');
      const day = String(tempDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const displayDate = tempDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const monthName = tempDate.toLocaleDateString("en-US", { month: "short" });

      data.push({
        date: dateStr,
        displayDate,
        monthName,
        count: activity[dateStr] || 0,
        level: getLevel(activity[dateStr] || 0),
      });
      tempDate.setDate(tempDate.getDate() + 1);
    }
    return data;
  }, [activity]);

  // Split data into weeks (7 days each)
  const weeks = useMemo(() => {
    const result = [];
    for (let i = 0; i < gridData.length; i += 7) {
      result.push(gridData.slice(i, i + 7));
    }
    return result;
  }, [gridData]);

  // Render month labels aligned with weeks
  const monthLabels = useMemo(() => {
    const labels: { text: string; colIndex: number }[] = [];
    let prevMonth = "";

    weeks.forEach((week, wIdx) => {
      if (week.length === 0) return;
      const monthStr = week[0].monthName;

      if (monthStr !== prevMonth) {
        labels.push({ text: monthStr, colIndex: wIdx });
        prevMonth = monthStr;
      }
    });
    return labels;
  }, [weeks]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [weeks]);

  return (
    <div className="rounded-xl border bg-card text-card-foreground p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-emerald-500" />
          <span>Platform Activity</span>
        </h3>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30">
          Published Updates
        </span>
      </div>

      <div
        ref={scrollContainerRef}
        className="relative overflow-x-auto pb-2 scrollbar-none"
      >
        <div className="min-w-[480px]">
          {/* Months Headers */}
          <div className="flex gap-1.5 mb-1">
            <div className="w-7 shrink-0" />
            <div className="relative w-full text-[9px] text-slate-400 dark:text-zinc-550 h-4">
              {monthLabels.map((lbl, idx) => (
                <span
                  key={idx}
                  className="absolute"
                  style={{ left: `${lbl.colIndex * 13}px` }}
                >
                  {lbl.text}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-1.5">
            {/* Days Indicators */}
            <div className="flex flex-col justify-around text-[9px] text-slate-400 dark:text-zinc-500 pr-1 select-none leading-[11px]">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            {/* Grid Cells */}
            <div className="flex gap-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1">
                  {week.map((cell, cIdx) => (
                    <div
                      key={cIdx}
                      className={`h-[9px] w-[9px] rounded-sm transition-colors duration-200 cursor-pointer ${
                        cell.level === 0
                          ? "bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700"
                          : cell.level === 1
                          ? "bg-green-200 dark:bg-green-950/40 hover:bg-green-300 dark:hover:bg-green-900/60"
                          : cell.level === 2
                          ? "bg-green-400 dark:bg-green-800 hover:bg-green-500 dark:hover:bg-green-700"
                          : cell.level === 3
                          ? "bg-green-600 dark:bg-green-600 hover:bg-green-700 dark:hover:bg-green-500"
                          : "bg-green-800 dark:bg-green-400 hover:bg-green-900 dark:hover:bg-green-300"
                      }`}
                      onClick={() => {
                        router.push(`/activity/${encodeURIComponent(cell.date)}`);
                      }}
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Tooltip & Legend */}
      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-1 min-h-[14px]">
          {hoveredCell ? (
            <span className="font-medium text-slate-700 dark:text-zinc-300">
              {hoveredCell.count === 0 ? "No activity" : `${hoveredCell.count} updates`}{" "}
              <span className="text-slate-400 dark:text-zinc-500 font-normal">on {hoveredCell.date}</span>
            </span>
          ) : (
            <span className="flex items-center gap-0.5">
              <Info className="h-3 w-3" />
              Hover squares for details
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1 select-none">
          <span>Less</span>
          <div className="h-2 w-2 rounded-sm bg-slate-100 dark:bg-zinc-800" />
          <div className="h-2 w-2 rounded-sm bg-green-200 dark:bg-green-950/30" />
          <div className="h-2 w-2 rounded-sm bg-green-400 dark:bg-green-800" />
          <div className="h-2 w-2 rounded-sm bg-green-600" />
          <div className="h-2 w-2 rounded-sm bg-green-800" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
