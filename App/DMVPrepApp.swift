import SwiftUI
import DMVEngine

@main
struct DMVPrepApp: App {
    @StateObject private var environment = AppEnvironment.bootstrap()

    var body: some Scene {
        WindowGroup {
            if let pack = environment.pack {
                HomeView()
                    .environmentObject(environment)
                    .environment(\.contentPack, pack)
            } else {
                LoadFailureView(error: environment.loadError)
            }
        }
    }
}

private struct LoadFailureView: View {
    let error: Error?
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle.fill").font(.system(size: 48))
            Text("Couldn't load this state's content pack.")
                .font(.headline)
            if let error {
                Text(String(describing: error))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            Text("This is a build configuration error. Reinstall from the App Store.")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .padding(32)
    }
}
