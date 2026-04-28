import Foundation

public struct SRSCard: Codable, Hashable, Sendable {
    public let questionID: String
    public var repetition: Int
    public var easeFactor: Double
    public var intervalDays: Double
    public var dueDate: Date

    public init(
        questionID: String,
        repetition: Int = 0,
        easeFactor: Double = 2.5,
        intervalDays: Double = 0,
        dueDate: Date = .distantPast
    ) {
        self.questionID = questionID
        self.repetition = repetition
        self.easeFactor = easeFactor
        self.intervalDays = intervalDays
        self.dueDate = dueDate
    }
}

/// Modified SM-2 spaced repetition.
/// Quality grade 0–5 maps to recall confidence (0 = blackout, 5 = perfect).
/// Failure (q < 3) resets the schedule; success widens the interval by ease factor.
public struct SRSEngine {
    public init() {}

    public func update(_ card: SRSCard, quality: Int, now: Date = Date()) -> SRSCard {
        precondition((0...5).contains(quality), "SRS quality must be in 0...5")
        var c = card
        if quality < 3 {
            c.repetition = 0
            c.intervalDays = 1.0
        } else {
            c.repetition += 1
            let q = Double(quality)
            let delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
            c.easeFactor = max(1.3, c.easeFactor + delta)
            switch c.repetition {
            case 1: c.intervalDays = 1.0
            case 2: c.intervalDays = 6.0
            default: c.intervalDays *= c.easeFactor
            }
        }
        c.dueDate = now.addingTimeInterval(c.intervalDays * 86_400)
        return c
    }

    public func dueCards(_ cards: [SRSCard], now: Date = Date()) -> [SRSCard] {
        cards.filter { $0.dueDate <= now }
    }
}
