import Foundation

public struct Agency: Codable, Hashable, Sendable {
    public let name: String
    public let fullName: String
    public let url: String
}

public struct ExamFormat: Codable, Hashable, Sendable {
    public let officialName: String
    public let questionCount: Int
    public let passingScore: Int
    public let passingPercent: Int
    public let timeLimitMinutes: Int?
    public let sectionFormat: String
    public let retakeRule: String
    public let feeRetake: Double?
}

public struct LanguageSupport: Codable, Hashable, Sendable {
    public let ui: [String]
    public let test: [String]
    public let note: String?
}

public struct Category: Codable, Hashable, Identifiable, Sendable {
    public let id: String
    public let name: String
    public let weight: Double
}

public struct HandbookSource: Codable, Hashable, Sendable {
    public let url: String
    public let version: String
    public let lastReviewed: String
}
