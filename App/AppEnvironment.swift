import SwiftUI
import DMVEngine

/// Shared app-level state. Owns the content pack, progress store, and store manager.
/// Constructed once at launch via `bootstrap()` from the active `STATE_CODE` Info.plist key.
@MainActor
final class AppEnvironment: ObservableObject {
    @Published var pack: ContentPack?
    @Published var loadError: Error?
    @Published var progressStore: ProgressStore

    let testEngine: TestEngine?
    let mockGenerator: MockTestGenerator?
    let streakTracker = StreakTracker()

    private init(pack: ContentPack?, error: Error?, store: ProgressStore) {
        self.pack = pack
        self.loadError = error
        self.progressStore = store
        if let pack {
            self.testEngine = TestEngine(pack: pack)
            self.mockGenerator = MockTestGenerator(pack: pack)
        } else {
            self.testEngine = nil
            self.mockGenerator = nil
        }
    }

    static func bootstrap() -> AppEnvironment {
        let code = ContentPackLoader.activeStateCode() ?? "FL"
        let store: ProgressStore = makeStore()
        do {
            let pack = try ContentPackLoader().load(stateCode: code)
            return AppEnvironment(pack: pack, error: nil, store: store)
        } catch {
            return AppEnvironment(pack: nil, error: error, store: store)
        }
    }

    private static func makeStore() -> ProgressStore {
        do {
            let url = try GRDBProgressStore.defaultURL()
            return try GRDBProgressStore(path: url.path)
        } catch {
            // Disk-failure fallback: an in-memory store keeps the app usable for the session.
            // Logged at the app boundary, not silenced — but never blocks the user from studying.
            print("[DMVPrep] GRDB init failed; falling back to in-memory store: \(error)")
            return InMemoryProgressStore()
        }
    }

    /// Today's streak length, reading attempts on demand. Zero on any storage error.
    func currentStreak() -> Int {
        let attempts = (try? progressStore.loadAttempts()) ?? []
        return streakTracker.currentStreak(attempts: attempts)
    }
}

private struct ContentPackKey: EnvironmentKey {
    static let defaultValue: ContentPack? = nil
}

extension EnvironmentValues {
    var contentPack: ContentPack? {
        get { self[ContentPackKey.self] }
        set { self[ContentPackKey.self] = newValue }
    }
}
