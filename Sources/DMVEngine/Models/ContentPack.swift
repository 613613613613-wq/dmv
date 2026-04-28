import Foundation

/// A complete content pack for one US state — metadata, exam config, and question bank.
public struct ContentPack: Codable, Sendable {
    public let code: String
    public let name: String
    public let agency: Agency
    public let exam: ExamFormat
    public let languages: LanguageSupport
    public let categories: [Category]
    public let handbook: HandbookSource
    public let specialNotes: [String]
    public let questions: [Question]

    public func questions(in categoryID: String) -> [Question] {
        questions.filter { $0.category == categoryID }
    }

    public func category(_ id: String) -> Category? {
        categories.first { $0.id == id }
    }
}
