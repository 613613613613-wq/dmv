import SwiftUI
import DMVEngine

struct PracticeView: View {
    @Environment(\.contentPack) private var pack
    @EnvironmentObject private var env: AppEnvironment

    @State private var current: Question?
    // Ordered FIFO queue — Set was insertion-order undefined and would evict
    // arbitrary IDs on overflow rather than the oldest.
    @State private var recentlySeen: [String] = []
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
        let progress = UserProgress(attempts: attempts, recentlySeen: Set(recentlySeen))
        let cards = (try? env.progressStore.loadSRS()) ?? []
        if let q = engine.nextPracticeQuestion(progress: progress, srsCards: cards) {
            current = q
            recentlySeen.append(q.id)
            attemptStart = Date()
            // Cap recently-seen window so we don't run out of pool on small packs.
            let cap = max(1, min(50, pack.questions.count - 1))
            if recentlySeen.count > cap {
                recentlySeen.removeFirst(recentlySeen.count - cap)
            }
        }
    }

    private func recordAttempt(choiceID: String, on q: Question) {
        let elapsed = Date().timeIntervalSince(attemptStart)
        let attempt = Attempt(
            questionID: q.id,
            correct: q.isCorrect(choiceID),
            timeSpentSeconds: elapsed,
            timestamp: Date()
        )
        try? env.progressStore.recordAttempt(attempt)

        // SM-2 quality 0–5. We grade by correctness + response time so the ease
        // factor can actually grow on confident answers (binary 1/4 left ease
        // permanently stuck around 2.5).
        let quality: Int
        if !q.isCorrect(choiceID) {
            quality = 1
        } else if elapsed > 12 {
            quality = 3                 // correct but slow → ease ~unchanged
        } else {
            quality = 5                 // correct and confident → ease grows
        }
        let cards = (try? env.progressStore.loadSRS()) ?? []
        let existing = cards.first(where: { $0.questionID == q.id }) ?? SRSCard(questionID: q.id)
        let updated = SRSEngine().update(existing, quality: quality)
        try? env.progressStore.upsertSRS(updated)
    }
}
