import SwiftUI
import DMVEngine

/// Test-day checklist — what to bring to the appointment, what to expect on the exam.
/// Items are state-specific and authored in the content pack's `specialNotes` plus the canonical list below.
struct TestDayChecklistView: View {
    @Environment(\.contentPack) private var pack
    @AppStorage("dmv.testDay.checked") private var checkedRaw: String = ""

    var body: some View {
        List {
            Section("What to bring") {
                ForEach(bringItems, id: \.self) { item in
                    ChecklistRow(label: item, isChecked: binding(for: item))
                }
            }
            if let pack {
                Section("Florida-specific") {
                    ForEach(pack.specialNotes, id: \.self) { note in
                        Label(note, systemImage: "info.circle")
                            .font(.callout)
                    }
                }
                Section("Exam format") {
                    LabeledContent("Questions", value: "\(pack.exam.questionCount)")
                    LabeledContent("To pass", value: "\(pack.exam.passingScore) correct (\(pack.exam.passingPercent)%)")
                    if let limit = pack.exam.timeLimitMinutes {
                        LabeledContent("Time limit", value: "\(limit) minutes")
                    } else {
                        LabeledContent("Time limit", value: "None")
                    }
                    LabeledContent("Retake", value: pack.exam.retakeRule)
                    if let fee = pack.exam.feeRetake {
                        LabeledContent("Retake fee", value: String(format: "$%.2f", fee))
                    }
                }
            }
        }
        .navigationTitle("Test-Day Checklist")
    }

    private var bringItems: [String] {
        [
            "Government-issued photo ID (for under-18 applicants: birth certificate)",
            "Proof of Social Security Number",
            "Two proofs of residential address (utility bill, lease, etc.)",
            "TLSAE 4-hour course completion certificate",
            "Eyeglasses or contacts (if you wear them)",
            "Payment for the application fee",
        ]
    }

    private func binding(for item: String) -> Binding<Bool> {
        Binding(
            get: { Set(checkedRaw.split(separator: "|").map(String.init)).contains(item) },
            set: { newValue in
                var set = Set(checkedRaw.split(separator: "|").map(String.init))
                if newValue { set.insert(item) } else { set.remove(item) }
                checkedRaw = set.sorted().joined(separator: "|")
            }
        )
    }
}

private struct ChecklistRow: View {
    let label: String
    @Binding var isChecked: Bool
    var body: some View {
        Button { isChecked.toggle() } label: {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: isChecked ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(isChecked ? .green : .secondary)
                    .font(.title3)
                Text(label)
                    .foregroundStyle(.primary)
                    .strikethrough(isChecked, color: .secondary)
            }
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(isChecked ? [.isButton, .isSelected] : .isButton)
    }
}
