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
}
