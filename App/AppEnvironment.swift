import SwiftUI
import DMVEngine

/// Shared app-level state. Owns the content pack, progress store, and store manager.
/// Constructed once at launch via `bootstrap()` from the active `STATE_CODE` Info.plist key.
@MainActor
final class AppEnvironment: ObservableObject {
    @Published var pack: ContentPack?
    @Published var loadError: Error?
    @Published var progressStore: ProgressStore = InMemoryProgressStore()

    let testEngine: TestEngine?
    let mockGenerator: MockTestGenerator?

    private init(pack: ContentPack?, error: Error?) {
        self.pack = pack
        self.loadError = error
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
        do {
            let pack = try ContentPackLoader().load(stateCode: code)
            return AppEnvironment(pack: pack, error: nil)
        } catch {
            return AppEnvironment(pack: nil, error: error)
        }
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
