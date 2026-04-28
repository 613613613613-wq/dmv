import Foundation

/// Picks the next practice question, weighted by SRS due-status and the user's weak categories.
public struct TestEngine {
    public let pack: ContentPack
    public let srs: SRSEngine

    public init(pack: ContentPack, srs: SRSEngine = SRSEngine()) {
        self.pack = pack
        self.srs = srs
    }

    /// Three-tier priority: SRS due cards → questions in weak categories → pure random.
    /// Returns nil only if the pack is empty.
    public func nextPracticeQuestion(progress: UserProgress, srsCards: [SRSCard]) -> Question? {
        let due = srs.dueCards(srsCards)
        let dueIDs = Set(due.map { $0.questionID })
        let dueQuestions = pack.questions.filter { dueIDs.contains($0.id) }
        if let q = pickRandom(dueQuestions, excluding: progress.recentlySeen) {
            return q
        }

        let weak = progress.bottomCategories(count: 3, in: pack)
        for cat in weak.shuffled() {
            if let q = pickRandom(pack.questions(in: cat), excluding: progress.recentlySeen) {
                return q
            }
        }

        return pickRandom(pack.questions, excluding: progress.recentlySeen)
            ?? pack.questions.randomElement()
    }

    private func pickRandom(_ pool: [Question], excluding: Set<String>) -> Question? {
        pool.filter { !excluding.contains($0.id) }.randomElement()
    }
}
