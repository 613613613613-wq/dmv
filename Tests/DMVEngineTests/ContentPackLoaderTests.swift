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
            .appendingPathComponent("ContentPacks/florida.json")
        let pack = try ContentPackLoader().load(from: url)
        XCTAssertEqual(pack.code, "FL")
        XCTAssertFalse(pack.questions.isEmpty)
        for q in pack.questions {
            XCTAssertNotNil(q.choices.first { $0.id == q.correct },
                "Question \(q.id) has correct='\(q.correct)' but no matching choice")
        }
    }
}
