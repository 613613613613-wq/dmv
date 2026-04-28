import Foundation

public struct Choice: Codable, Hashable, Identifiable, Sendable {
    public let id: String
    public let text: Localized
}

public struct HandbookReference: Codable, Hashable, Sendable {
    public let section: String
    public let page: Int?
    public let url: String?
}

public struct Question: Codable, Hashable, Identifiable, Sendable {
    public let id: String
    public let category: String
    public let difficulty: Int
    public let stem: Localized
    public let choices: [Choice]
    public let correct: String
    public let explanation: Localized
    public let handbookRef: HandbookReference?
    public let tags: [String]

    public func isCorrect(_ choiceID: String) -> Bool {
        choiceID == correct
    }
}
