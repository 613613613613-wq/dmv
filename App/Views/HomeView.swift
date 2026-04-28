import SwiftUI
import DMVEngine

struct HomeView: View {
    @Environment(\.contentPack) private var pack
    @EnvironmentObject private var env: AppEnvironment

    var body: some View {
        guard let pack else { return AnyView(EmptyView()) }
        return AnyView(NavigationStack {
            List {
                Section {
                    NavigationLink(destination: PracticeView()) {
                        ModeRow(icon: "graduationcap.fill", title: "Practice", subtitle: "Adaptive — focuses on your weak categories")
                    }
                    NavigationLink(destination: MockTestView()) {
                        ModeRow(icon: "doc.text.fill", title: "Mock Test", subtitle: "\(pack.exam.questionCount) questions • \(pack.exam.passingPercent)% to pass")
                    }
                    NavigationLink(destination: ReviewView()) {
                        ModeRow(icon: "arrow.uturn.backward.circle.fill", title: "Review Wrong Answers", subtitle: "With handbook references")
                    }
                }
                Section("State") {
                    LabeledContent("Agency", value: pack.agency.name)
                    LabeledContent("Exam", value: pack.exam.officialName)
                    LabeledContent("Handbook", value: pack.handbook.version)
                }
                Section("Settings") {
                    NavigationLink("Settings & Accessibility") { SettingsView() }
                    NavigationLink("Bookmarks") { BookmarksView() }
                }
            }
            .navigationTitle(pack.name)
            .listStyle(.insetGrouped)
        })
    }
}

private struct ModeRow: View {
    let icon: String
    let title: String
    let subtitle: String
    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: icon).font(.title2).frame(width: 36)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.headline)
                Text(subtitle).font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}
