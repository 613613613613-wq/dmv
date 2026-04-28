import Foundation
@testable import DMVEngine

enum TestFixtures {
    static func smallPack(
        questionCount: Int,
        perCategory: Int,
        categoryWeights: [(id: String, weight: Double)] = [
            ("signs", 0.4), ("rules", 0.3), ("safety", 0.2), ("parking", 0.1),
        ]
    ) -> ContentPack {
        let categories = categoryWeights.map { Category(id: $0.id, name: $0.id.capitalized, weight: $0.weight) }
        var questions: [Question] = []
        for cat in categories {
            for i in 0..<perCategory {
                questions.append(makeQuestion(id: "\(cat.id)-\(i)", category: cat.id))
            }
        }
        return ContentPack(
            code: "TS",
            name: "Test State",
            agency: Agency(name: "TSA", fullName: "Test State Agency", url: "https://example.test"),
            exam: ExamFormat(
                officialName: "Test Exam",
                questionCount: questionCount,
                passingScore: Int(Double(questionCount) * 0.8),
                passingPercent: 80,
                timeLimitMinutes: nil,
                sectionFormat: "single",
                retakeRule: "anytime",
                feeRetake: 0
            ),
            languages: LanguageSupport(ui: ["en"], test: ["en"], note: nil),
            categories: categories,
            handbook: HandbookSource(url: "https://example.test/handbook", version: "2026", lastReviewed: "2026-01-01"),
            specialNotes: [],
            questions: questions
        )
    }

    static func makeQuestion(id: String, category: String) -> Question {
        Question(
            id: id,
            category: category,
            difficulty: 1,
            stem: Localized(["en": "Stem \(id)?"]),
            choices: [
                Choice(id: "a", text: Localized(["en": "A"])),
                Choice(id: "b", text: Localized(["en": "B"])),
                Choice(id: "c", text: Localized(["en": "C"])),
                Choice(id: "d", text: Localized(["en": "D"])),
            ],
            correct: "a",
            explanation: Localized(["en": "Because reasons."]),
            handbookRef: nil,
            tags: []
        )
    }
}
