import SwiftUI
import DMVEngine

struct BookmarksView: View {
    @Environment(\.contentPack) private var pack
    @EnvironmentObject private var env: AppEnvironment
    @State private var bookmarked: [Question] = []

    var body: some View {
        List {
            if bookmarked.isEmpty {
                ContentUnavailableView(
                    "No bookmarks",
                    systemImage: "bookmark",
                    description: Text("Tap the bookmark on any question to save it for later.")
                )
            } else {
                ForEach(bookmarked) { q in
                    Text(q.stem.value(for: "en")).lineLimit(2)
                }
            }
        }
        .navigationTitle("Bookmarks")
        .onAppear(perform: load)
    }

    private func load() {
        guard let pack else { return }
        let ids = (try? env.progressStore.bookmarkedIDs()) ?? []
        bookmarked = pack.questions.filter { ids.contains($0.id) }
    }
}
