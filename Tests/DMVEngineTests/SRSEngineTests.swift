import XCTest
@testable import DMVEngine

final class SRSEngineTests: XCTestCase {
    let engine = SRSEngine()
    let now = Date(timeIntervalSince1970: 1_700_000_000)

    func testFailureResetsRepetitionAndIntervalToOneDay() {
        let card = SRSCard(questionID: "q1", repetition: 4, easeFactor: 2.7, intervalDays: 30)
        let updated = engine.update(card, quality: 1, now: now)
        XCTAssertEqual(updated.repetition, 0)
        XCTAssertEqual(updated.intervalDays, 1.0, accuracy: 0.001)
        XCTAssertEqual(updated.dueDate.timeIntervalSince(now), 86_400, accuracy: 1)
    }

    func testFirstSuccessSetsOneDay() {
        let updated = engine.update(SRSCard(questionID: "q1"), quality: 4, now: now)
        XCTAssertEqual(updated.repetition, 1)
        XCTAssertEqual(updated.intervalDays, 1.0, accuracy: 0.001)
    }

    func testSecondSuccessSetsSixDays() {
        var card = SRSCard(questionID: "q1")
        card = engine.update(card, quality: 4, now: now)
        card = engine.update(card, quality: 4, now: now)
        XCTAssertEqual(card.repetition, 2)
        XCTAssertEqual(card.intervalDays, 6.0, accuracy: 0.001)
    }

    func testEaseFactorNeverDropsBelowFloor() {
        var card = SRSCard(questionID: "q1", easeFactor: 1.31)
        card = engine.update(card, quality: 3, now: now)
        XCTAssertGreaterThanOrEqual(card.easeFactor, 1.3)
    }

    func testHigherQualityYieldsLongerInterval() {
        var low = SRSCard(questionID: "low")
        var high = SRSCard(questionID: "high")
        for _ in 0..<5 {
            low = engine.update(low, quality: 3, now: now)
            high = engine.update(high, quality: 5, now: now)
        }
        XCTAssertGreaterThan(high.intervalDays, low.intervalDays)
    }

    func testDueCardsFiltersByDate() {
        let past = SRSCard(questionID: "a", dueDate: now.addingTimeInterval(-100))
        let future = SRSCard(questionID: "b", dueDate: now.addingTimeInterval(100))
        let due = engine.dueCards([past, future], now: now)
        XCTAssertEqual(due.map(\.questionID), ["a"])
    }
}
