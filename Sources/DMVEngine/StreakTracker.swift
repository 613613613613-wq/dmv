import Foundation

/// Computes the current daily study streak from raw attempts.
/// "Day" boundaries follow the user's current calendar — no timezones, just local midnights.
public struct StreakTracker {
    public init() {}

    public func currentStreak(attempts: [Attempt], now: Date = Date(), calendar: Calendar = .current) -> Int {
        guard !attempts.isEmpty else { return 0 }
        let activeDays = Set(attempts.map { calendar.startOfDay(for: $0.timestamp) })
        var streak = 0
        var cursor = calendar.startOfDay(for: now)
        // Allow today to count if there's an attempt; otherwise start counting from yesterday.
        if !activeDays.contains(cursor) {
            guard let yesterday = calendar.date(byAdding: .day, value: -1, to: cursor) else { return 0 }
            cursor = yesterday
        }
        while activeDays.contains(cursor) {
            streak += 1
            guard let prev = calendar.date(byAdding: .day, value: -1, to: cursor) else { break }
            cursor = prev
        }
        return streak
    }

    public func longestStreak(attempts: [Attempt], calendar: Calendar = .current) -> Int {
        guard !attempts.isEmpty else { return 0 }
        let activeDays = Array(Set(attempts.map { calendar.startOfDay(for: $0.timestamp) })).sorted()
        var longest = 1
        var current = 1
        for i in 1..<activeDays.count {
            if let next = calendar.date(byAdding: .day, value: 1, to: activeDays[i - 1]),
               next == activeDays[i] {
                current += 1
                longest = max(longest, current)
            } else {
                current = 1
            }
        }
        return longest
    }
}
