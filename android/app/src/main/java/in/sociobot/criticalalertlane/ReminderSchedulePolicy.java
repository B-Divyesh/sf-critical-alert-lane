package in.sociobot.criticalalertlane;

/** Pure timing decisions, kept separate so repeat/quiet-hour behavior is unit-testable without a device. */
final class ReminderSchedulePolicy {
    private ReminderSchedulePolicy() {}

    static long initialTrigger(long dueAt, long now, boolean quiet, long quietEnd) {
        if (dueAt > now) return dueAt;
        return quiet ? quietEnd : now + 1_000L;
    }

    static long nextTriggerAfterAlarm(long dueAt, long now, long repeatMinutes, boolean quiet, long quietEnd) {
        if (dueAt > now) return dueAt;
        if (quiet) return quietEnd;
        return now + Math.max(repeatMinutes, 5L) * 60_000L;
    }
}
