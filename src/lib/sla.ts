import { WORKING_HOURS, SLA_RESPONSE_MINUTES } from './constants.ts';

/**
 * Converts a UTC Date into IST (UTC+05:30) date components.
 */
export function toIST(date: Date): {
  year: number;
  month: number;
  day: number;
  dayOfWeek: number; // 0 = Sun, 1 = Mon ... 6 = Sat
  hour: number;
  minute: number;
  totalMinuteOfDay: number;
} {
  // IST is UTC + 330 minutes
  const istTimeMs = date.getTime() + WORKING_HOURS.timezoneOffsetMinutes * 60 * 1000;
  const istDate = new Date(istTimeMs);

  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth();
  const day = istDate.getUTCDate();
  const dayOfWeek = istDate.getUTCDay();
  const hour = istDate.getUTCHours();
  const minute = istDate.getUTCMinutes();

  return {
    year,
    month,
    day,
    dayOfWeek,
    hour,
    minute,
    totalMinuteOfDay: hour * 60 + minute,
  };
}

/**
 * Calculates working minutes between start and end (09:00-18:00 IST, Mon-Sat).
 */
export function calculateWorkingMinutesElapsed(startDate: Date, endDate: Date): number {
  if (endDate.getTime() <= startDate.getTime()) {
    return 0;
  }

  const startWorkMinute = WORKING_HOURS.startHour * 60; // 540 (09:00)
  const endWorkMinute = WORKING_HOURS.endHour * 60;     // 1080 (18:00)
  const workMinutesPerDay = endWorkMinute - startWorkMinute; // 540 minutes (9 hours)

  let currentMs = startDate.getTime();
  const endMs = endDate.getTime();
  let totalWorkingMinutes = 0;

  // Step through by minute chunks or day segments
  // For safety and exactness over typical enquiry timeframes, we step day by day
  let cursor = new Date(currentMs);

  while (cursor.getTime() < endMs) {
    const ist = toIST(cursor);
    const isWorkingDay = WORKING_HOURS.workingDays.includes(ist.dayOfWeek);

    // End of today in IST
    const istMidnightMs = Date.UTC(ist.year, ist.month, ist.day) - WORKING_HOURS.timezoneOffsetMinutes * 60 * 1000;
    const startOfTodayWorkMs = istMidnightMs + startWorkMinute * 60 * 1000;
    const endOfTodayWorkMs = istMidnightMs + endWorkMinute * 60 * 1000;
    const endOfTodayMs = istMidnightMs + 24 * 60 * 60 * 1000;

    if (isWorkingDay) {
      const windowStartMs = Math.max(cursor.getTime(), startOfTodayWorkMs);
      const windowEndMs = Math.min(endMs, endOfTodayWorkMs);

      if (windowEndMs > windowStartMs) {
        totalWorkingMinutes += Math.floor((windowEndMs - windowStartMs) / (60 * 1000));
      }
    }

    // Advance cursor to next day at 00:00 IST
    cursor = new Date(endOfTodayMs);
  }

  return totalWorkingMinutes;
}

export interface SLAEvaluation {
  isOverdue: boolean;
  workingMinutesElapsed: number;
  minutesRemaining: number;
  label: string;
  status: 'WITHIN_SLA' | 'URGENT' | 'OVERDUE' | 'RESOLVED_ON_TIME' | 'RESOLVED_LATE';
}

/**
 * Evaluates whether an enquiry is overdue or approaching SLA deadline.
 */
export function evaluateEnquirySLA(
  createdAt: Date,
  firstResponseAt?: Date | null,
  now: Date = new Date()
): SLAEvaluation {
  const resolved = Boolean(firstResponseAt);
  const targetEndDate = firstResponseAt || now;
  const workingMinutesElapsed = calculateWorkingMinutesElapsed(createdAt, targetEndDate);
  const minutesRemaining = Math.max(0, SLA_RESPONSE_MINUTES - workingMinutesElapsed);
  const isOverdue = workingMinutesElapsed > SLA_RESPONSE_MINUTES;

  if (resolved) {
    return {
      isOverdue,
      workingMinutesElapsed,
      minutesRemaining: 0,
      label: isOverdue
        ? `Replied in ${workingMinutesElapsed}m (Late)`
        : `Replied in ${workingMinutesElapsed}m (On time)`,
      status: isOverdue ? 'RESOLVED_LATE' : 'RESOLVED_ON_TIME',
    };
  }

  if (isOverdue) {
    const overdueBy = workingMinutesElapsed - SLA_RESPONSE_MINUTES;
    return {
      isOverdue: true,
      workingMinutesElapsed,
      minutesRemaining: 0,
      label: `Overdue by ${overdueBy}m`,
      status: 'OVERDUE',
    };
  }

  if (minutesRemaining <= 15) {
    return {
      isOverdue: false,
      workingMinutesElapsed,
      minutesRemaining,
      label: `${minutesRemaining}m left`,
      status: 'URGENT',
    };
  }

  return {
    isOverdue: false,
    workingMinutesElapsed,
    minutesRemaining,
    label: `${minutesRemaining}m left`,
    status: 'WITHIN_SLA',
  };
}
