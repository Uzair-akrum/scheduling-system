import { rrulestr, RRule } from "rrule";
import { Shift } from "@prisma/client";

interface Occurrence {
  startTime: Date;
  endTime: Date;
}

/**
 * Expand a recurring shift's RRULE into concrete dates within a range
 */
export function getOccurrencesInRange(
  shift: Shift,
  rangeStart: Date,
  rangeEnd: Date
): Occurrence[] {
  if (!shift.isRecurring || !shift.recurrenceRule) {
    return [];
  }

  try {
    // Parse the RRULE
    const rule = rrulestr(shift.recurrenceRule, {
      dtstart: shift.startTime,
    });

    // Get all occurrences between rangeStart and rangeEnd
    const occurrences = rule.between(rangeStart, rangeEnd, true);

    // Calculate shift duration
    const duration = shift.endTime.getTime() - shift.startTime.getTime();

    // Map occurrences to full date ranges
    return occurrences.map((occurrence) => ({
      startTime: occurrence,
      endTime: new Date(occurrence.getTime() + duration),
    }));
  } catch (error) {
    console.error("Error parsing RRULE:", error);
    return [];
  }
}

/**
 * Preview occurrences for a new recurring shift before it's created
 */
export function previewOccurrences(
  startTime: Date,
  endTime: Date,
  rruleString: string,
  rangeEnd: Date,
  maxOccurrences = 100
): Occurrence[] {
  try {
    const rule = rrulestr(rruleString, {
      dtstart: startTime,
    });

    const duration = endTime.getTime() - startTime.getTime();
    const occurrences = rule.between(startTime, rangeEnd, true);

    return occurrences.slice(0, maxOccurrences).map((occurrence) => ({
      startTime: occurrence,
      endTime: new Date(occurrence.getTime() + duration),
    }));
  } catch (error) {
    console.error("Error previewing occurrences:", error);
    return [];
  }
}

/**
 * Build an RRULE string from user-friendly parameters
 */
export interface RecurrenceConfig {
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  interval: number;
  byDay?: string[]; // MO, TU, WE, TH, FR, SA, SU
  byHour?: number;
  byMinute?: number;
  count?: number;
  until?: Date;
}

export function buildRRule(config: RecurrenceConfig): string {
  const options: Partial<RRule.Options> = {
    freq: {
      DAILY: RRule.DAILY,
      WEEKLY: RRule.WEEKLY,
      MONTHLY: RRule.MONTHLY,
    }[config.frequency],
    interval: config.interval || 1,
  };

  if (config.byDay && config.byDay.length > 0) {
    const dayMap: Record<string, any> = {
      MO: RRule.MO,
      TU: RRule.TU,
      WE: RRule.WE,
      TH: RRule.TH,
      FR: RRule.FR,
      SA: RRule.SA,
      SU: RRule.SU,
    };
    options.byweekday = config.byDay.map((day) => dayMap[day]);
  }

  if (config.count) {
    options.count = config.count;
  }

  if (config.until) {
    options.until = config.until;
  }

  const rule = new RRule(options as RRule.Options);
  return rule.toString();
}

/**
 * Parse an RRULE string into a human-readable description
 */
export function describeRRule(rruleString: string): string {
  try {
    const rule = rrulestr(rruleString);
    return rule.toText();
  } catch {
    return "Custom recurrence";
  }
}
