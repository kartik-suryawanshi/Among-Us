import React from 'react';
import type { CommitActivityResponse } from '../types/activity';
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
  isLoading?: boolean;
}

export const CommitActivityTimeline: React.FC<CommitActivityTimelineProps> = ({
  activity,
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
      ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : item.week;
    return {
      week: label,
      count: item.count,
    };
  });

  // Format day-of-week data
  const daysOrder: (keyof import('../types/activity').DayOfWeekDistribution)[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const dayData = daysOrder.map((day) => ({
    day: day.slice(0, 3),
    fullName: day,
    count: activity.byDayOfWeek ? activity.byDayOfWeek[day] || 0 : 0,
  }));

  // Calculate busiest day
  let busiestDay = 'N/A';
  let maxDayCount = -1;
  dayData.forEach((d) => {
    if (d.count > maxDayCount) {
      maxDayCount = d.count;
      busiestDay = d.fullName;
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
          <span>{activity.totalCommits} commits (52 weeks)</span>
          <span>Busiest: {busiestDay} ({maxDayCount > 0 ? maxDayCount : 0})</span>
        </div>
      </div>

      {/* Grid: 52-week velocity chart + Day of week distribution */}
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '6px',
                    fontSize: '11px',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                  }}
                  formatter={(val: unknown) => [
                    `${val} ${Number(val) === 1 ? 'commit' : 'commits'}`,
                    'Activity',
                  ]}
                />
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
          <div className="text-xs font-medium text-neutral-600">
            Day-of-Week Distribution
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '6px',
                    fontSize: '11px',
                  }}
                  formatter={(val: unknown) => [`${val} commits`, 'Total']}
                />
                <Bar dataKey="count" fill="#475569" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
