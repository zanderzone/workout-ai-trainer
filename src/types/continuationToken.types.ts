export interface ContinuationToken {
    token: string;
    missingDays: number[];
    missingWeeks: number[];
    currentWeek?: number | null;
    nextWeek?: number | null;
}
