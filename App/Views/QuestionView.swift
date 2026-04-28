import SwiftUI
import DMVEngine

/// Reusable question presenter — used by both practice and mock test modes.
/// Locks selection after answering in practice mode (immediate feedback).
/// In mock mode, parent suppresses the explanation reveal until the test ends.
struct QuestionView: View {
    let question: Question
    let language: String
    let revealsAnswer: Bool
    let onAnswer: (String) -> Void

    @State private var selected: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text(question.stem.value(for: language))
                    .font(.title3)
                    .fontWeight(.semibold)
                    .accessibilityAddTraits(.isHeader)

                ForEach(question.choices) { choice in
                    Button {
                        guard selected == nil else { return }
                        selected = choice.id
                        onAnswer(choice.id)
                    } label: {
                        ChoiceRow(
                            choice: choice,
                            language: language,
                            state: state(for: choice.id)
                        )
                    }
                    .buttonStyle(.plain)
                    .accessibilityHint(accessibilityHint(for: choice))
                }

                if revealsAnswer, let selected, let chosen = question.choices.first(where: { $0.id == selected }) {
                    ExplanationCard(
                        wasCorrect: question.isCorrect(selected),
                        chosenLabel: chosen.text.value(for: language),
                        explanation: question.explanation.value(for: language),
                        handbookRef: question.handbookRef
                    )
                    .transition(.opacity)
                }
            }
            .padding()
        }
        .animation(.easeInOut, value: selected)
    }

    private func state(for choiceID: String) -> ChoiceRow.State {
        guard revealsAnswer, let selected else {
            return self.selected == choiceID ? .selected : .idle
        }
        if choiceID == question.correct { return .correct }
        if choiceID == selected { return .wrong }
        return .idle
    }

    private func accessibilityHint(for choice: Choice) -> String {
        revealsAnswer && selected != nil
            ? (question.isCorrect(choice.id) ? "Correct answer" : "")
            : "Tap to select this answer"
    }
}

private struct ChoiceRow: View {
    enum State { case idle, selected, correct, wrong }
    let choice: Choice
    let language: String
    let state: State

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(iconColor)
                .frame(width: 24)
            Text(choice.text.value(for: language))
                .multilineTextAlignment(.leading)
            Spacer()
        }
        .padding()
        .background(background)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(border, lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var icon: String {
        switch state {
        case .idle: return "circle"
        case .selected: return "circle.inset.filled"
        case .correct: return "checkmark.circle.fill"
        case .wrong: return "xmark.circle.fill"
        }
    }
    private var iconColor: Color {
        switch state {
        case .correct: return .green
        case .wrong: return .red
        case .selected: return .accentColor
        case .idle: return .secondary
        }
    }
    private var background: Color {
        switch state {
        case .correct: return .green.opacity(0.12)
        case .wrong: return .red.opacity(0.12)
        case .selected: return .accentColor.opacity(0.08)
        case .idle: return Color(.secondarySystemBackground)
        }
    }
    private var border: Color {
        switch state {
        case .correct: return .green.opacity(0.5)
        case .wrong: return .red.opacity(0.5)
        case .selected: return .accentColor.opacity(0.5)
        case .idle: return .clear
        }
    }
}

private struct ExplanationCard: View {
    let wasCorrect: Bool
    let chosenLabel: String
    let explanation: String
    let handbookRef: HandbookReference?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: wasCorrect ? "checkmark.seal.fill" : "exclamationmark.triangle.fill")
                Text(wasCorrect ? "Correct" : "Not quite")
                    .fontWeight(.semibold)
            }
            .foregroundStyle(wasCorrect ? .green : .orange)
            Text(explanation).font(.callout)
            if let ref = handbookRef {
                Divider()
                VStack(alignment: .leading, spacing: 2) {
                    Text("Handbook: \(ref.section)")
                        .font(.caption).foregroundStyle(.secondary)
                    if let page = ref.page {
                        Text("Page \(page)").font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.tertiarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
