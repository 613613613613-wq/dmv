import Foundation

/// Storage protocol kept abstract so the engine package has no DB dependencies in tests.
/// The app target supplies a concrete GRDB-backed implementation.
public protocol ProgressStore: AnyObject {
    func recordAttempt(_ attempt: Attempt) throws
    func loadAttempts() throws -> [Attempt]

    func upsertSRS(_ card: SRSCard) throws
    func loadSRS() throws -> [SRSCard]

    func toggleBookmark(questionID: String) throws -> Bool
    func bookmarkedIDs() throws -> Set<String>

    func saveMockResult(_ result: MockTestResult) throws
    func loadMockResults() throws -> [MockTestResult]
}

/// In-memory store used by previews and tests.
public final class InMemoryProgressStore: ProgressStore {
    private var attempts: [Attempt] = []
    private var srs: [String: SRSCard] = [:]
    private var bookmarks: Set<String> = []
    private var mockResults: [MockTestResult] = []

    public init() {}

    public func recordAttempt(_ attempt: Attempt) throws { attempts.append(attempt) }
    public func loadAttempts() throws -> [Attempt] { attempts }

    public func upsertSRS(_ card: SRSCard) throws { srs[card.questionID] = card }
    public func loadSRS() throws -> [SRSCard] { Array(srs.values) }

    public func toggleBookmark(questionID: String) throws -> Bool {
        if bookmarks.contains(questionID) {
            bookmarks.remove(questionID); return false
        } else {
            bookmarks.insert(questionID); return true
        }
    }
    public func bookmarkedIDs() throws -> Set<String> { bookmarks }

    public func saveMockResult(_ result: MockTestResult) throws { mockResults.append(result) }
    public func loadMockResults() throws -> [MockTestResult] { mockResults }
}
