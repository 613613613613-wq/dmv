import SwiftUI
import DMVEngine

struct PracticeView: View {
    @Environment(\.contentPack) private var pack
    @EnvironmentObject private var env: AppEnvironment

    @State private var current: Question?
    @State private var recentlySeen: Set<String> = []
    @State private var attemptStart = Date()
    @State private var language = "en"

    var body: some View {
        Group {
            if let current {
                QuestionView(
                    question: current,
                    language: language,
                    revealsAnswer: true,
                    onAnswer: { choiceID in
                        recordAttempt(choiceID: choiceID, on: current)
                    }
                )
                .id(current.id)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Next") { advance() }
                    }
                }
            } else {
                ProgressView().onAppear { advance() }
            }
        }
        .navigationTitle("Practice")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func advance() {
        guard let pack, let engine = env.testEngine else { return }
        let attempts = (try? env.progressStore.loadAttempts()) ?? []
        let progress = UserProgress(attempts: attempts, recentlySeen: recentlySeen)
        let cards = (try? env.progressStore.loadSRS()) ?? []
        if let q = engine.nextPracticeQuestion(progress: progress, srsCards: cards) {
            current = q
            recentlySeen.insert(q.id)
            attemptStart = Date()
            // Cap recently-seen window so we don't run out of pool on small packs.
            if recentlySeen.count > min(50, pack.questions.count - 1) {
                recentlySeen.removeFirst()
            }
        }
    }

    private func recordAttempt(choiceID: String, on q: Question) {
        let attempt = Attempt(
            questionID: q.id,
            correct: q.isCorrect(choiceID),
            timeSpentSeconds: Date().timeIntervalSince(attemptStart),
            timestamp: Date()
        )
        try? env.progressStore.recordAttempt(attempt)

        // Update SRS using a heuristic quality grade.
        let quality = q.isCorrect(choiceID) ? 4 : 1
        let cards = (try? env.progressStore.loadSRS()) ?? []
        let existing = cards.first(where: { $0.questionID == q.id }) ?? SRSCard(questionID: q.id)
        let updated = SRSEngine().update(existing, quality: quality)
        try? env.progressStore.upsertSRS(updated)
    }
}
