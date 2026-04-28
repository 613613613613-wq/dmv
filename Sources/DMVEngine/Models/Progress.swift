import Foundation

public struct Attempt: Codable, Hashable, Sendable {
    public let questionID: String
    public let correct: Bool
    public let timeSpentSeconds: Double
    public let timestamp: Date

    public init(questionID: String, correct: Bool, timeSpentSeconds: Double, timestamp: Date) {
        self.questionID = questionID
        self.correct = correct
        self.timeSpentSeconds = timeSpentSeconds
        self.timestamp = timestamp
    }
}

public struct CategoryStats: Sendable {
    public let categoryID: String
    public let attempts: Int
    public let correct: Int
    public var accuracy: Double {
        attempts == 0 ? 0 : Double(correct) / Double(attempts)
    }
}

public struct UserProgress: Sendable {
    public let attempts: [Attempt]
    public let recentlySeen: Set<String>

    public init(attempts: [Attempt] = [], recentlySeen: Set<String> = []) {
        self.attempts = attempts
        self.recentlySeen = recentlySeen
    }

    public func categoryStats(for pack: ContentPack) -> [CategoryStats] {
        let questionToCategory = Dictionary(uniqueKeysWithValues: pack.questions.map { ($0.id, $0.category) })
        var totals: [String: (attempts: Int, correct: Int)] = [:]
        for a in attempts {
            guard let cat = questionToCategory[a.questionID] else { continue }
            var entry = totals[cat] ?? (0, 0)
            entry.attempts += 1
            if a.correct { entry.correct += 1 }
            totals[cat] = entry
        }
        return pack.categories.map { c in
            let t = totals[c.id] ?? (0, 0)
            return CategoryStats(categoryID: c.id, attempts: t.attempts, correct: t.correct)
        }
    }

    /// Returns the N categories with the lowest accuracy (ignoring categories with no attempts).
    public func bottomCategories(count n: Int, in pack: ContentPack) -> [String] {
        categoryStats(for: pack)
            .filter { $0.attempts > 0 }
            .sorted { $0.accuracy < $1.accuracy }
            .prefix(n)
            .map { $0.categoryID }
    }
}
