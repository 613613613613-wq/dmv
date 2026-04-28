import SwiftUI
import DMVEngine

struct ResultView: View {
    let result: MockTestResult
    let total: Int
    let onRetake: () -> Void

    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: result.passed ? "checkmark.seal.fill" : "xmark.seal.fill")
                .font(.system(size: 72))
                .foregroundStyle(result.passed ? .green : .red)

            Text(result.passed ? "Passed" : "Did not pass")
                .font(.largeTitle).fontWeight(.bold)

            VStack(spacing: 4) {
                Text("\(result.score) / \(total) correct")
                    .font(.title3)
                Text(percentText).foregroundStyle(.secondary)
                Text("Time: \(formatDuration(result.durationSeconds))")
                    .font(.caption).foregroundStyle(.secondary)
            }

            VStack(spacing: 12) {
                Button("Retake Mock Test", action: onRetake)
                    .buttonStyle(.borderedProminent)
                NavigationLink("Review Wrong Answers") { ReviewView() }
            }
        }
        .padding(32)
    }

    private var percentText: String {
        let pct = Double(result.score) / Double(total) * 100
        return String(format: "%.0f%%", pct)
    }

    private func formatDuration(_ s: Int) -> String {
        let m = s / 60, sec = s % 60
        return "\(m)m \(sec)s"
    }
}
