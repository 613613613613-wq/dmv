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

    public func generate() -> MockTest {
        let target = pack.exam.questionCount
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
            passingScore: pack.exam.passingScore,
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
