import XCTest
@testable import DMVEngine

final class TestEngineTests: XCTestCase {
    func testSRSDueCardsTakePriority() {
        let pack = TestFixtures.smallPack(questionCount: 20, perCategory: 10)
        let engine = TestEngine(pack: pack)
        let dueID = pack.questions.first!.id
        let dueCard = SRSCard(questionID: dueID, dueDate: Date().addingTimeInterval(-1))
        let q = engine.nextPracticeQuestion(progress: UserProgress(), srsCards: [dueCard])
        XCTAssertEqual(q?.id, dueID)
    }

    func testFallsBackToWeakCategoryWhenNoSRSDue() {
        let pack = TestFixtures.smallPack(
            questionCount: 20,
            perCategory: 10,
            categoryWeights: [("signs", 1.0)]
        )
        let signsQs = pack.questions(in: "signs")
        let attempts = signsQs.prefix(5).flatMap { q -> [Attempt] in
            (0..<3).map { _ in Attempt(questionID: q.id, correct: false, timeSpentSeconds: 5, timestamp: Date()) }
        }
        let progress = UserProgress(attempts: Array(attempts))
        let engine = TestEngine(pack: pack)
        let picked = engine.nextPracticeQuestion(progress: progress, srsCards: [])
        XCTAssertEqual(picked?.category, "signs")
    }

    func testExcludesRecentlySeen() {
        let pack = TestFixtures.smallPack(questionCount: 4, perCategory: 4)
        let allButOne = Set(pack.questions.dropLast().map(\.id))
        let progress = UserProgress(recentlySeen: allButOne)
        let engine = TestEngine(pack: pack)
        let picked = engine.nextPracticeQuestion(progress: progress, srsCards: [])
        XCTAssertEqual(picked?.id, pack.questions.last?.id)
    }
}
