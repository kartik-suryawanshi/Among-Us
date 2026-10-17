import React from 'react';
import type { CommitActivityResponse, DayOfWeekDistribution } from '../types/activity';
import type { CommitSummary } from '../types/commit';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Activity, Calendar } from 'lucide-react';

interface CommitActivityTimelineProps {
  activity: CommitActivityResponse | null;
  commits?: CommitSummary[];
  isLoading?: boolean;
}

interface DayTooltipPayloadItem {
  payload: {
    day: string;
    fullName: string;
    count: number;
    dates: string[];
    latestDate: string | null;
  };
}

interface CustomDayTooltipProps {
  active?: boolean;
  payload?: DayTooltipPayloadItem[];
}

const CustomDayTooltip: React.FC<CustomDayTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3 text-xs space-y-1.5 min-w-[170px] max-w-[260px] font-sans">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-1.5 font-semibold text-neutral-900">
        <span>{data.fullName}</span>
        <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 font-mono text-[11px] font-bold">
          {data.count} {data.count === 1 ? 'commit' : 'commits'}
        </span>
      </div>

      <div className="text-[11px] text-neutral-600">
        {data.count > 0 ? (
          data.dates.length === 1 ? (
            <div className="flex items-baseline gap-1">
              <span className="text-neutral-400">Date:</span>
              <span className="font-semibold text-neutral-900">{data.dates[0]}</span>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-neutral-400">Latest date:</span>
                <span className="font-semibold text-neutral-900">{data.latestDate}</span>
              </div>
              <div className="text-[10px] text-neutral-500 pt-1 border-t border-neutral-100 leading-relaxed">
                <span className="text-neutral-400">All dates: </span>
                {data.dates.slice(0, 3).join(', ')}
                {data.dates.length > 3 ? ` (+${data.dates.length - 3} more)` : ''}
              </div>
            </div>
          )
        ) : (
          <span className="text-neutral-400 italic">No commits recorded on {data.fullName}s</span>
        )}
      </div>
    </div>
  );
};

interface WeeklyTooltipPayloadItem {
  payload: {
    week: string;
    count: number;
  };
}

interface CustomWeeklyTooltipProps {
  active?: boolean;
  payload?: WeeklyTooltipPayloadItem[];
}

const CustomWeeklyTooltip: React.FC<CustomWeeklyTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-2.5 text-xs space-y-1 min-w-[140px] font-sans">
      <div className="text-[11px] font-semibold text-neutral-900">
        Week of {data.week}
      </div>
      <div className="text-neutral-600 flex items-center justify-between text-[11px]">
        <span className="text-neutral-400">Activity:</span>
        <span className="font-mono font-bold text-neutral-900">
          {data.count} {data.count === 1 ? 'commit' : 'commits'}
        </span>
      </div>
    </div>
  );
};

export const CommitActivityTimeline: React.FC<CommitActivityTimelineProps> = ({
  activity,
  commits = [],
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-4 animate-pulse">
        <div className="h-4 w-44 bg-neutral-200 rounded" />
        <div className="h-48 bg-neutral-100 rounded" />
      </div>
    );
  }

  if (!activity || !activity.weeklyTimeline || activity.weeklyTimeline.length === 0) {
    return null;
  }

  // Format weekly data for timeline
  const timelineData = activity.weeklyTimeline.map((item) => {
    const d = new Date(item.week);
    const label = !isNaN(d.getTime())
      ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : item.week;
    return {
      week: label,
      count: item.count,
    };
  });

  // Days sequence starting Sunday
  const daysOrder: (keyof DayOfWeekDistribution)[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  // Map each day of week to specific calendar dates
  const dayDatesMap: Record<string, string[]> = {
    Sunday: [],
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
  };

  // 1. Populate from activity.dayDates if available from backend
  if (activity?.dayDates) {
    Object.entries(activity.dayDates).forEach(([day, dates]) => {
      if (Array.isArray(dates)) {
        dates.forEach((d) => {
          if (!dayDatesMap[day]?.includes(d)) {
            dayDatesMap[day]?.push(d);
          }
        });
      }
    });
  }

  // 2. Also populate from commits prop if available to ensure full fidelity
  if (commits && commits.length > 0) {
    commits.forEach((c) => {
      const dateStr = c.author?.date || c.committer?.date;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      const dayName = daysOrder[d.getDay()];
      const ymd = d.toISOString().split('T')[0];
      if (dayName && !dayDatesMap[dayName].includes(ymd)) {
        dayDatesMap[dayName].push(ymd);
      }
    });
  }

  // Sort dates descending (newest first)
  Object.keys(dayDatesMap).forEach((day) => {
    dayDatesMap[day].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  });

  // Format day-of-week data with formatted date strings
  const dayData = daysOrder.map((day) => {
    const rawDates = dayDatesMap[day] || [];
    const formattedDates = rawDates.map((dateStr) => {
      const d = new Date(dateStr);
      return !isNaN(d.getTime())
        ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : dateStr;
    });

    return {
      day: day.slice(0, 3),
      fullName: day,
      count: activity.byDayOfWeek ? activity.byDayOfWeek[day] || 0 : 0,
      dates: formattedDates,
      latestDate: formattedDates[0] || null,
    };
  });

  // Calculate busiest day and its latest date
  let busiestDay = 'N/A';
  let busiestDate: string | null = null;
  let maxDayCount = 0;
  dayData.forEach((d) => {
    if (d.count > maxDayCount) {
      maxDayCount = d.count;
      busiestDay = d.fullName;
      busiestDate = d.latestDate;
    }
  });

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-neutral-700" />
          <h2 className="text-sm font-semibold text-neutral-900 tracking-tight">
            Commit Activity Timeline
          </h2>
        </div>
        <div className="flex items-center gap-4 text-xs text-neutral-500 font-mono">
          <span>
            {activity.totalCommits} {activity.totalCommits === 1 ? 'commit' : 'commits'}{' '}
            {activity.period === 'all_time' ? '(all time)' : '(52 weeks)'}
          </span>
          <span>
            Busiest: {busiestDay} ({maxDayCount}{busiestDate ? ` · ${busiestDate}` : ''})
          </span>
        </div>
      </div>

      {activity.totalCommits === 0 ? (
        <div className="py-8 text-center text-xs text-neutral-400 font-mono">
          No commit activity recorded for this repository.
        </div>
      ) : (
        /* Grid: 52-week velocity chart + Day of week distribution */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Weekly Timeline AreaChart */}
          <div className="lg:col-span-8 space-y-2">
            <div className="text-xs font-medium text-neutral-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <span>Weekly Commit Velocity</span>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip content={<CustomWeeklyTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#0f172a"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#velocityGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Day of Week BarChart */}
          <div className="lg:col-span-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-neutral-600">
                Day-of-Week Distribution
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">
                Hover for dates
              </span>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip content={<CustomDayTooltip />} />
                  <Bar dataKey="count" fill="#475569" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
