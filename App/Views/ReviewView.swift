import SwiftUI
import DMVEngine

struct ReviewView: View {
    @Environment(\.contentPack) private var pack
    @EnvironmentObject private var env: AppEnvironment

    @State private var wrongQuestions: [Question] = []

    var body: some View {
        List {
            if wrongQuestions.isEmpty {
                ContentUnavailableView(
                    "No wrong answers yet",
                    systemImage: "checkmark.circle",
                    description: Text("Wrong answers from practice and mock tests will appear here for review.")
                )
            } else {
                ForEach(wrongQuestions) { q in
                    NavigationLink(destination: WrongAnswerDetail(question: q)) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(q.stem.value(for: "en")).font(.subheadline).lineLimit(2)
                            if let cat = pack?.category(q.category) {
                                Text(cat.name).font(.caption).foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Review")
        .onAppear(perform: load)
    }

    private func load() {
        guard let pack else { return }
        let attempts = (try? env.progressStore.loadAttempts()) ?? []
        let wrongIDs = Set(attempts.filter { !$0.correct }.map(\.questionID))
        wrongQuestions = pack.questions.filter { wrongIDs.contains($0.id) }
    }
}

private struct WrongAnswerDetail: View {
    let question: Question

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(question.stem.value(for: "en")).font(.title3).fontWeight(.semibold)
                ForEach(question.choices) { c in
                    HStack {
                        Image(systemName: c.id == question.correct ? "checkmark.circle.fill" : "circle")
                            .foregroundStyle(c.id == question.correct ? .green : .secondary)
                        Text(c.text.value(for: "en"))
                    }
                }
                Divider()
                Text("Why").font(.headline)
                Text(question.explanation.value(for: "en"))
                if let ref = question.handbookRef {
                    Divider()
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Handbook").font(.headline)
                        Text(ref.section)
                        if let page = ref.page { Text("Page \(page)").foregroundStyle(.secondary) }
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Review")
        .navigationBarTitleDisplayMode(.inline)
    }
}
