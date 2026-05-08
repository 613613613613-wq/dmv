import XCTest
@testable import DMVEngine

final class ContentPackLoaderTests: XCTestCase {
    func testRoundTripDecodesAllFields() throws {
        let pack = TestFixtures.smallPack(questionCount: 50, perCategory: 5)
        let data = try JSONEncoder().encode(pack)
        let decoded = try JSONDecoder().decode(ContentPack.self, from: data)
        XCTAssertEqual(decoded.code, pack.code)
        XCTAssertEqual(decoded.questions.count, pack.questions.count)
        XCTAssertEqual(decoded.categories.count, pack.categories.count)
    }

    func testLocalizedFallsBackToEnglish() {
        let l = Localized(["en": "Hello", "es": "Hola"])
        XCTAssertEqual(l.value(for: "es"), "Hola")
        XCTAssertEqual(l.value(for: "ht"), "Hello")
    }

    func testBundledFloridaPackLoads() throws {
        let url = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent("ContentPacks/fl.json")
        let pack = try ContentPackLoader().load(from: url)
        XCTAssertEqual(pack.code, "FL")
        XCTAssertFalse(pack.questions.isEmpty)
        for q in pack.questions {
            XCTAssertNotNil(q.choices.first { $0.id == q.correct },
                "Question \(q.id) has correct='\(q.correct)' but no matching choice")
        }
    }

    /// Every language listed in `languages.ui` must have ≥80% translation coverage on
    /// question stems and choices. Catches packs that advertise languages they haven't
    /// actually translated (silent feature failure — picker switches, content stays English).
    func testEveryUILanguageHasTranslationCoverage() throws {
        let url = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent("ContentPacks/fl.json")
        let pack = try ContentPackLoader().load(from: url)
        for lang in pack.languages.ui where lang != "en" {
            let translated = pack.questions.filter { $0.stem.translations[lang] != nil }.count
            let coverage = Double(translated) / Double(max(1, pack.questions.count))
            XCTAssertGreaterThanOrEqual(coverage, 0.80,
                "Pack lists '\(lang)' as a UI language but only \(translated)/\(pack.questions.count) " +
                "questions have a stem translation. Either translate the bank or remove '\(lang)' from languages.ui.")
        }
    }
}
