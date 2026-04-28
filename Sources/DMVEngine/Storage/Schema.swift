import Foundation

/// SQLite schema for local user progress.
/// Defined as raw DDL strings so the engine has zero external dependencies in tests.
/// The app target wires these into GRDB.swift; see Storage/Database.swift.
public enum Schema {
    public static let version = 1

    public static let createAttempts = """
    CREATE TABLE IF NOT EXISTS attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_id TEXT NOT NULL,
        correct INTEGER NOT NULL,
        time_spent_seconds REAL NOT NULL,
        timestamp INTEGER NOT NULL
    );
    """

    public static let createSRSCards = """
    CREATE TABLE IF NOT EXISTS srs_cards (
        question_id TEXT PRIMARY KEY,
        repetition INTEGER NOT NULL DEFAULT 0,
        ease_factor REAL NOT NULL DEFAULT 2.5,
        interval_days REAL NOT NULL DEFAULT 0,
        due_date INTEGER NOT NULL
    );
    """

    public static let createBookmarks = """
    CREATE TABLE IF NOT EXISTS bookmarks (
        question_id TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL
    );
    """

    public static let createMockResults = """
    CREATE TABLE IF NOT EXISTS mock_test_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        score INTEGER NOT NULL,
        total INTEGER NOT NULL,
        passed INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        duration_seconds INTEGER NOT NULL
    );
    """

    public static let indexes = [
        "CREATE INDEX IF NOT EXISTS idx_attempts_question ON attempts(question_id);",
        "CREATE INDEX IF NOT EXISTS idx_srs_due ON srs_cards(due_date);",
    ]

    public static var allStatements: [String] {
        [createAttempts, createSRSCards, createBookmarks, createMockResults] + indexes
    }
}
