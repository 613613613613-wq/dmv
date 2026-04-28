import Foundation
import DMVEngine

// Standalone smoke check — exercises the engine end-to-end without XCTest.
// Run with `swift run SmokeCheck`.
// Useful for CI machines or contributors without Xcode installed.

func check(_ condition: @autoclosure () -> Bool, _ label: String) {
    if condition() {
        print("  ✓ \(label)")
    } else {
        print("  ✗ FAILED: \(label)")
        exit(1)
    }
}

func section(_ title: String) {
    print("\n\(title)")
}

// 1. Bundled Florida pack loads and is internally consistent.
section("ContentPack — Florida")
let packURL = URL(fileURLWithPath: #filePath)
    .deletingLastPathComponent()
    .deletingLastPathComponent()
    .deletingLastPathComponent()
    .appendingPathComponent("ContentPacks/florida.json")
let pack = try ContentPackLoader().load(from: packURL)
check(pack.code == "FL", "code is FL")
check(pack.exam.questionCount == 50, "Class E has 50 questions")
check(pack.exam.passingScore == 40, "passing score is 40 / 80%")
check(pack.questions.count >= 15, "ships at least the 15 sample questions")
for q in pack.questions {
    let valid = q.choices.contains { $0.id == q.correct }
    check(valid, "  question \(q.id): correct='\(q.correct)' resolves to a real choice")
}
let categoryWeightSum = pack.categories.reduce(0.0) { $0 + $1.weight }
check(abs(categoryWeightSum - 1.0) < 0.001, "category weights sum to 1.0 (got \(categoryWeightSum))")

// 2. SRS algorithm — failure resets, success widens.
section("SRSEngine — SM-2 algorithm")
let srs = SRSEngine()
let card1 = srs.update(SRSCard(questionID: "q1"), quality: 4)
check(card1.repetition == 1 && abs(card1.intervalDays - 1.0) < 0.001, "first success → 1 day")
let card2 = srs.update(card1, quality: 4)
check(card2.repetition == 2 && abs(card2.intervalDays - 6.0) < 0.001, "second success → 6 days")
let failed = srs.update(card2, quality: 1)
check(failed.repetition == 0 && abs(failed.intervalDays - 1.0) < 0.001, "failure resets to 1 day")
let edge = srs.update(SRSCard(questionID: "q", easeFactor: 1.31), quality: 3)
check(edge.easeFactor >= 1.3, "ease factor floor at 1.3")

// 3. Mock test generator — clamped to available, weight-stratified.
section("MockTestGenerator")
let mock = MockTestGenerator(pack: pack).generate()
let expectedCount = min(pack.exam.questionCount, pack.questions.count)
check(mock.questions.count == expectedCount,
      "produces \(expectedCount) questions (clamped: target=\(pack.exam.questionCount), available=\(pack.questions.count))")
let allCorrect = Dictionary(uniqueKeysWithValues: mock.questions.map { ($0.id, $0.correct) })
let perfectResult = MockTestGenerator.score(mock, answers: allCorrect, duration: 600)
check(perfectResult.score == mock.questions.count, "perfect answers → max score")
let zeroResult = MockTestGenerator.score(mock, answers: [:], duration: 600)
check(!zeroResult.passed && zeroResult.score == 0, "no answers → failed")

// 4. TestEngine prioritizes SRS due cards.
section("TestEngine")
let dueID = pack.questions.first!.id
let due = SRSCard(questionID: dueID, dueDate: Date().addingTimeInterval(-1))
let next = TestEngine(pack: pack).nextPracticeQuestion(progress: UserProgress(), srsCards: [due])
check(next?.id == dueID, "due SRS card surfaced first")

// 5. Localized fallback.
section("Localized")
let l = Localized(["en": "Hello", "es": "Hola"])
check(l.value(for: "es") == "Hola", "exact-match returns Spanish")
check(l.value(for: "ht") == "Hello", "missing language falls back to English")

print("\n✅ All smoke checks passed.")
