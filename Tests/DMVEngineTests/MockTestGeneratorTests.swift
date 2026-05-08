import XCTest
@testable import DMVEngine

final class MockTestGeneratorTests: XCTestCase {
    func testProducesExactQuestionCount() {
        let pack = TestFixtures.smallPack(questionCount: 50, perCategory: 100)
        let mock = MockTestGenerator(pack: pack).generate()
        XCTAssertEqual(mock.questions.count, 50)
    }

    func testRespectsCategoryWeightsApproximately() {
        let pack = TestFixtures.smallPack(questionCount: 50, perCategory: 100)
        let mock = MockTestGenerator(pack: pack).generate()
        for cat in pack.categories {
            let actual = mock.questions.filter { $0.category == cat.id }.count
            let target = Int((50.0 * cat.weight).rounded())
            XCTAssertLessThanOrEqual(abs(actual - target), 2,
                "Category \(cat.id) target=\(target) actual=\(actual)")
        }
    }

    func testScoringCountsCorrectAnswers() {
        let pack = TestFixtures.smallPack(questionCount: 10, perCategory: 5)
        let mock = MockTestGenerator(pack: pack).generate()
        let answers = Dictionary(uniqueKeysWithValues: mock.questions.map { ($0.id, $0.correct) })
        let result = MockTestGenerator.score(mock, answers: answers, duration: 600)
        XCTAssertEqual(result.score, mock.questions.count)
        XCTAssertTrue(result.passed)
    }

    func testScoringMissingAnswersCountAsWrong() {
        let pack = TestFixtures.smallPack(questionCount: 10, perCategory: 5)
        let mock = MockTestGenerator(pack: pack).generate()
        let result = MockTestGenerator.score(mock, answers: [:], duration: 600)
        XCTAssertEqual(result.score, 0)
        XCTAssertFalse(result.passed)
    }

    func testTopsUpWhenWeightsRoundDown() {
        let pack = TestFixtures.smallPack(
            questionCount: 10,
            perCategory: 50,
            categoryWeights: [("a", 0.33), ("b", 0.33), ("c", 0.33)]
        )
        let mock = MockTestGenerator(pack: pack).generate()
        XCTAssertEqual(mock.questions.count, 10)
    }

    func testClampsAndScalesWhenPackIsShort() {
        // Sample pack: configured 50-question / 40-pass exam, but only 15 questions available.
        // Engine must clamp count to 15 and scale passing score proportionally so the test stays winnable.
        let pack = TestFixtures.smallPack(
            questionCount: 50,
            perCategory: 4,                                 // 4 cats × 4 = 16 total, 1 stripped below
            categoryWeights: [("a", 0.4), ("b", 0.3), ("c", 0.2), ("d", 0.1)]
        )
        let shortPack = ContentPack(
            code: pack.code, name: pack.name, agency: pack.agency, exam: pack.exam,
            languages: pack.languages, categories: pack.categories, handbook: pack.handbook,
            specialNotes: pack.specialNotes, questions: Array(pack.questions.prefix(15))
        )
        let dims = MockTestGenerator.plannedDimensions(for: shortPack)
        XCTAssertEqual(dims.questionCount, 15, "clamp to available pool")
        XCTAssertEqual(dims.passingScore, 12, "scale 80% pass mark proportionally → 12 of 15")

        let mock = MockTestGenerator(pack: shortPack).generate()
        XCTAssertEqual(mock.questions.count, 15)
        XCTAssertEqual(mock.passingScore, 12)
    }

    func testEmptyPackProducesEmptyMockWithoutCrash() {
        let pack = TestFixtures.smallPack(questionCount: 50, perCategory: 0)
        let dims = MockTestGenerator.plannedDimensions(for: pack)
        XCTAssertEqual(dims.questionCount, 0)
        XCTAssertEqual(dims.passingScore, 0)
        let mock = MockTestGenerator(pack: pack).generate()
        XCTAssertTrue(mock.questions.isEmpty)
    }
}
