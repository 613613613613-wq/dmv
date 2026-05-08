import Foundation

public struct MockTest: Sendable {
    public let questions: [Question]
    public let passingScore: Int
    public let timeLimitMinutes: Int?
    public let officialName: String
}

public struct MockTestResult: Codable, Sendable {
    public let score: Int
    public let total: Int
    public let passed: Bool
    public let durationSeconds: Int
    public let timestamp: Date
}

/// Builds a mock test that mirrors the state's real exam: stratified sampling by category weight.
public struct MockTestGenerator {
    public let pack: ContentPack

    public init(pack: ContentPack) {
        self.pack = pack
    }

    /// Dimensions of the mock test that will be generated for this pack.
    /// When the pack ships fewer questions than the configured exam length (sample / WIP banks),
    /// the count is clamped to what's available and the pass mark is scaled proportionally so the
    /// test stays winnable. UI surfaces should display these, not `pack.exam.questionCount` directly.
    public struct Dimensions: Sendable {
        public let questionCount: Int
        public let passingScore: Int
        public let passingPercent: Int
    }

    public static func plannedDimensions(for pack: ContentPack) -> Dimensions {
        let count = min(pack.exam.questionCount, pack.questions.count)
        let ratio = Double(pack.exam.passingScore) / Double(max(1, pack.exam.questionCount))
        let passingScore = count == 0 ? 0 : max(1, Int((Double(count) * ratio).rounded()))
        let percent = count == 0 ? 0 : Int((Double(passingScore) / Double(count) * 100).rounded())
        return Dimensions(questionCount: count, passingScore: passingScore, passingPercent: percent)
    }

    public func generate() -> MockTest {
        let dims = Self.plannedDimensions(for: pack)
        let target = dims.questionCount
        var picks: [Question] = []
        picks.reserveCapacity(target)

        for category in pack.categories {
            let slot = Int((Double(target) * category.weight).rounded())
            let pool = pack.questions(in: category.id).shuffled()
            picks.append(contentsOf: pool.prefix(slot))
        }

        // If category weights produced fewer than target (rounding) or more, top up / trim.
        if picks.count < target {
            let chosen = Set(picks.map { $0.id })
            let remainder = pack.questions.filter { !chosen.contains($0.id) }.shuffled()
            picks.append(contentsOf: remainder.prefix(target - picks.count))
        } else if picks.count > target {
            picks = Array(picks.prefix(target))
        }

        return MockTest(
            questions: picks.shuffled(),
            passingScore: dims.passingScore,
            timeLimitMinutes: pack.exam.timeLimitMinutes,
            officialName: pack.exam.officialName
        )
    }

    public static func score(_ test: MockTest, answers: [String: String], duration: TimeInterval) -> MockTestResult {
        let correct = test.questions.reduce(into: 0) { acc, q in
            if let chosen = answers[q.id], q.isCorrect(chosen) { acc += 1 }
        }
        return MockTestResult(
            score: correct,
            total: test.questions.count,
            passed: correct >= test.passingScore,
            durationSeconds: Int(duration),
            timestamp: Date()
        )
    }
}
