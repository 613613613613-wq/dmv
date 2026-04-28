import SwiftUI
import DMVEngine

struct MockTestView: View {
    @Environment(\.contentPack) private var pack
    @EnvironmentObject private var env: AppEnvironment

    @State private var test: MockTest?
    @State private var index = 0
    @State private var answers: [String: String] = [:]
    @State private var startedAt = Date()
    @State private var result: MockTestResult?

    var body: some View {
        Group {
            if let result, let test {
                ResultView(result: result, total: test.questions.count, onRetake: { reset(); start() })
            } else if let test {
                runningView(test: test)
            } else {
                introView
            }
        }
        .navigationTitle("Mock Test")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var introView: some View {
        VStack(spacing: 16) {
            Image(systemName: "doc.text.fill").font(.system(size: 48)).foregroundStyle(.tint)
            if let pack {
                Text(pack.exam.officialName).font(.title2).fontWeight(.semibold)
                Text("\(pack.exam.questionCount) questions • Pass at \(pack.exam.passingPercent)%")
                    .font(.subheadline).foregroundStyle(.secondary)
                if let limit = pack.exam.timeLimitMinutes {
                    Label("\(limit) minute time limit", systemImage: "clock")
                        .font(.subheadline)
                } else {
                    Label("No time limit", systemImage: "clock")
                        .font(.subheadline).foregroundStyle(.secondary)
                }
                Text(pack.exam.retakeRule)
                    .font(.caption).foregroundStyle(.secondary).multilineTextAlignment(.center)
            }
            Button("Start Mock Test", action: start).buttonStyle(.borderedProminent)
        }
        .padding(32)
    }

    private func runningView(test: MockTest) -> some View {
        let q = test.questions[index]
        return VStack(spacing: 0) {
            ProgressView(value: Double(index + 1), total: Double(test.questions.count))
                .padding(.horizontal).padding(.top, 8)
            Text("Question \(index + 1) of \(test.questions.count)")
                .font(.caption).foregroundStyle(.secondary)
                .padding(.bottom, 4)
            QuestionView(
                question: q,
                language: "en",
                revealsAnswer: false,
                onAnswer: { choiceID in
                    answers[q.id] = choiceID
                }
            )
            HStack {
                Button("Previous") { if index > 0 { index -= 1 } }
                    .disabled(index == 0)
                Spacer()
                if index == test.questions.count - 1 {
                    Button("Submit") { finish(test: test) }
                        .buttonStyle(.borderedProminent)
                        .disabled(answers.count < test.questions.count)
                } else {
                    Button("Next") { index = min(test.questions.count - 1, index + 1) }
                        .buttonStyle(.borderedProminent)
                        .disabled(answers[q.id] == nil)
                }
            }
            .padding()
        }
    }

    private func start() {
        guard let gen = env.mockGenerator else { return }
        test = gen.generate()
        startedAt = Date()
    }
    private func reset() {
        test = nil; result = nil; index = 0; answers = [:]
    }
    private func finish(test: MockTest) {
        let r = MockTestGenerator.score(test, answers: answers, duration: Date().timeIntervalSince(startedAt))
        try? env.progressStore.saveMockResult(r)
        self.result = r
    }
}
