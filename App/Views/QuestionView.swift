import SwiftUI
import DMVEngine

/// Reusable question presenter — used by both practice and mock test modes.
/// Practice mode reveals the answer immediately on tap.
/// Mock mode suppresses reveal until the test ends.
struct QuestionView: View {
    let question: Question
    let language: String
    let revealsAnswer: Bool
    let onAnswer: (String) -> Void

    @State private var selected: String?
    @ScaledMetric(relativeTo: .body) private var rowSpacing: CGFloat = 12

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text(question.stem.value(for: language))
                    .font(.title3)
                    .fontWeight(.semibold)
                    .accessibilityAddTraits(.isHeader)
                    .accessibilityIdentifier("question.stem")

                ForEach(question.choices) { choice in
                    Button {
                        guard selected == nil else { return }
                        selected = choice.id
                        onAnswer(choice.id)
                    } label: {
                        ChoiceRow(
                            choice: choice,
                            language: language,
                            style: style(for: choice.id)
                        )
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(choice.text.value(for: language))
                    .accessibilityHint(accessibilityHint(for: choice))
                    .accessibilityAddTraits(.isButton)
                    .accessibilityIdentifier("choice.\(choice.id)")
                }

                if revealsAnswer, let selected, let chosen = question.choices.first(where: { $0.id == selected }) {
                    ExplanationCard(
                        wasCorrect: question.isCorrect(selected),
                        chosenLabel: chosen.text.value(for: language),
                        explanation: question.explanation.value(for: language),
                        handbookRef: question.handbookRef
                    )
                    .transition(.opacity)
                    .accessibilityIdentifier("explanation")
                }
            }
            .padding()
        }
        .animation(.easeInOut, value: selected)
    }

    private func style(for choiceID: String) -> ChoiceRow.Style {
        guard revealsAnswer, let selected else {
            return self.selected == choiceID ? .selected : .idle
        }
        if choiceID == question.correct { return .correct }
        if choiceID == selected { return .wrong }
        return .idle
    }

    private func accessibilityHint(for choice: Choice) -> String {
        guard revealsAnswer, selected != nil else {
            return NSLocalizedString("a11y.choice.idle", comment: "")
        }
        if choice.id == question.correct {
            return NSLocalizedString("a11y.choice.correct", comment: "")
        }
        if choice.id == selected {
            return NSLocalizedString("a11y.choice.wrong", comment: "")
        }
        return ""
    }
}

private struct ChoiceRow: View {
    enum Style { case idle, selected, correct, wrong }
    let choice: Choice
    let language: String
    let style: Style

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(iconColor)
                .frame(width: 24)
                .accessibilityHidden(true)
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
        switch style {
        case .idle: return "circle"
        case .selected: return "circle.inset.filled"
        case .correct: return "checkmark.circle.fill"
        case .wrong: return "xmark.circle.fill"
        }
    }
    private var iconColor: Color {
        switch style {
        case .correct: return .green
        case .wrong: return .red
        case .selected: return .accentColor
        case .idle: return .secondary
        }
    }
    private var background: Color {
        switch style {
        case .correct: return .green.opacity(0.12)
        case .wrong: return .red.opacity(0.12)
        case .selected: return .accentColor.opacity(0.08)
        case .idle: return Color(.secondarySystemBackground)
        }
    }
    private var border: Color {
        switch style {
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
                    .accessibilityHidden(true)
                Text(wasCorrect
                     ? NSLocalizedString("practice.correct", comment: "")
                     : NSLocalizedString("practice.notQuite", comment: ""))
                    .fontWeight(.semibold)
            }
            .foregroundStyle(wasCorrect ? .green : .orange)
            Text(explanation).font(.callout)
            if let ref = handbookRef {
                Divider()
                VStack(alignment: .leading, spacing: 2) {
                    Text(String(format: NSLocalizedString("practice.handbook", comment: ""), ref.section))
                        .font(.caption).foregroundStyle(.secondary)
                    if let page = ref.page {
                        Text(String(format: NSLocalizedString("practice.page", comment: ""), page))
                            .font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.tertiarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .accessibilityElement(children: .combine)
    }
}
