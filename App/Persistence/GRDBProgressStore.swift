import Foundation
import GRDB
import DMVEngine

/// GRDB-backed implementation of `ProgressStore`. Lives in the app target (not the engine package)
/// so the engine library remains dependency-free and the persistence stack is swappable per platform.
public final class GRDBProgressStore: ProgressStore {
    private let dbQueue: DatabaseQueue

    public init(path: String) throws {
        self.dbQueue = try DatabaseQueue(path: path)
        try migrate()
    }

    public static func defaultURL() throws -> URL {
        let dir = try FileManager.default.url(
            for: .applicationSupportDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        )
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent("dmv-progress.sqlite")
    }

    private func migrate() throws {
        var migrator = DatabaseMigrator()
        migrator.registerMigration("v1") { db in
            for stmt in Schema.allStatements {
                try db.execute(sql: stmt)
            }
        }
        try migrator.migrate(dbQueue)
    }

    public func recordAttempt(_ attempt: Attempt) throws {
        try dbQueue.write { db in
            try db.execute(
                sql: "INSERT INTO attempts (question_id, correct, time_spent_seconds, timestamp) VALUES (?, ?, ?, ?)",
                arguments: [
                    attempt.questionID,
                    attempt.correct ? 1 : 0,
                    attempt.timeSpentSeconds,
                    Int(attempt.timestamp.timeIntervalSince1970),
                ]
            )
        }
    }

    public func loadAttempts() throws -> [Attempt] {
        try dbQueue.read { db in
            let rows = try Row.fetchAll(db, sql: "SELECT question_id, correct, time_spent_seconds, timestamp FROM attempts ORDER BY timestamp DESC")
            return rows.map { row in
                Attempt(
                    questionID: row["question_id"],
                    correct: (row["correct"] as Int) == 1,
                    timeSpentSeconds: row["time_spent_seconds"],
                    timestamp: Date(timeIntervalSince1970: TimeInterval(row["timestamp"] as Int))
                )
            }
        }
    }

    public func upsertSRS(_ card: SRSCard) throws {
        try dbQueue.write { db in
            try db.execute(
                sql: """
                INSERT INTO srs_cards (question_id, repetition, ease_factor, interval_days, due_date)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(question_id) DO UPDATE SET
                  repetition=excluded.repetition,
                  ease_factor=excluded.ease_factor,
                  interval_days=excluded.interval_days,
                  due_date=excluded.due_date
                """,
                arguments: [
                    card.questionID,
                    card.repetition,
                    card.easeFactor,
                    card.intervalDays,
                    Int(card.dueDate.timeIntervalSince1970),
                ]
            )
        }
    }

    public func loadSRS() throws -> [SRSCard] {
        try dbQueue.read { db in
            let rows = try Row.fetchAll(db, sql: "SELECT question_id, repetition, ease_factor, interval_days, due_date FROM srs_cards")
            return rows.map { row in
                SRSCard(
                    questionID: row["question_id"],
                    repetition: row["repetition"],
                    easeFactor: row["ease_factor"],
                    intervalDays: row["interval_days"],
                    dueDate: Date(timeIntervalSince1970: TimeInterval(row["due_date"] as Int))
                )
            }
        }
    }

    public func toggleBookmark(questionID: String) throws -> Bool {
        try dbQueue.write { db in
            let existing = try Int.fetchOne(db, sql: "SELECT 1 FROM bookmarks WHERE question_id = ?", arguments: [questionID])
            if existing != nil {
                try db.execute(sql: "DELETE FROM bookmarks WHERE question_id = ?", arguments: [questionID])
                return false
            } else {
                try db.execute(
                    sql: "INSERT INTO bookmarks (question_id, created_at) VALUES (?, ?)",
                    arguments: [questionID, Int(Date().timeIntervalSince1970)]
                )
                return true
            }
        }
    }

    public func bookmarkedIDs() throws -> Set<String> {
        try dbQueue.read { db in
            let ids = try String.fetchAll(db, sql: "SELECT question_id FROM bookmarks")
            return Set(ids)
        }
    }

    public func saveMockResult(_ result: MockTestResult) throws {
        try dbQueue.write { db in
            try db.execute(
                sql: "INSERT INTO mock_test_results (score, total, passed, timestamp, duration_seconds) VALUES (?, ?, ?, ?, ?)",
                arguments: [
                    result.score,
                    result.total,
                    result.passed ? 1 : 0,
                    Int(result.timestamp.timeIntervalSince1970),
                    result.durationSeconds,
                ]
            )
        }
    }

    public func loadMockResults() throws -> [MockTestResult] {
        try dbQueue.read { db in
            let rows = try Row.fetchAll(db, sql: "SELECT score, total, passed, timestamp, duration_seconds FROM mock_test_results ORDER BY timestamp DESC")
            return rows.map { row in
                MockTestResult(
                    score: row["score"],
                    total: row["total"],
                    passed: (row["passed"] as Int) == 1,
                    durationSeconds: row["duration_seconds"],
                    timestamp: Date(timeIntervalSince1970: TimeInterval(row["timestamp"] as Int))
                )
            }
        }
    }
}
