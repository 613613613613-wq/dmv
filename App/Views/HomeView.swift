import SwiftUI
import DMVEngine

struct HomeView: View {
    @Environment(\.contentPack) private var pack
    @EnvironmentObject private var env: AppEnvironment

    @State private var streak = 0

    var body: some View {
        guard let pack else { return AnyView(EmptyView()) }
        return AnyView(NavigationStack {
            List {
                if streak > 0 {
                    Section {
                        StreakBadge(streak: streak)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .listRowBackground(Color.clear)
                            .listRowSeparator(.hidden)
                    }
                }
                Section {
                    NavigationLink(destination: PracticeView()) {
                        ModeRow(icon: "graduationcap.fill",
                                title: NSLocalizedString("home.practice", comment: ""),
                                subtitle: NSLocalizedString("home.practice.subtitle", comment: ""))
                    }
                    NavigationLink(destination: MockTestView()) {
                        ModeRow(icon: "doc.text.fill",
                                title: NSLocalizedString("home.mock", comment: ""),
                                subtitle: String(format: NSLocalizedString("home.mock.subtitle", comment: ""),
                                                 pack.exam.questionCount, pack.exam.passingPercent))
                    }
                    NavigationLink(destination: ReviewView()) {
                        ModeRow(icon: "arrow.uturn.backward.circle.fill",
                                title: NSLocalizedString("home.review", comment: ""),
                                subtitle: NSLocalizedString("home.review.subtitle", comment: ""))
                    }
                    NavigationLink(destination: TestDayChecklistView()) {
                        ModeRow(icon: "checklist",
                                title: NSLocalizedString("home.testday", comment: ""),
                                subtitle: NSLocalizedString("home.testday.subtitle", comment: ""))
                    }
                }
                Section(NSLocalizedString("home.section.state", comment: "")) {
                    LabeledContent(NSLocalizedString("home.agency", comment: ""), value: pack.agency.name)
                    LabeledContent(NSLocalizedString("home.exam", comment: ""), value: pack.exam.officialName)
                    LabeledContent(NSLocalizedString("home.handbook", comment: ""), value: pack.handbook.version)
                }
                Section(NSLocalizedString("home.section.settings", comment: "")) {
                    NavigationLink(NSLocalizedString("home.settings", comment: "")) { SettingsView() }
                    NavigationLink(NSLocalizedString("home.bookmarks", comment: "")) { BookmarksView() }
                }
            }
            .navigationTitle(pack.name)
            .listStyle(.insetGrouped)
            .onAppear { streak = env.currentStreak() }
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
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.headline)
                Text(subtitle).font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
        .accessibilityElement(children: .combine)
        .accessibilityHint(Text(NSLocalizedString("a11y.tap_to_open", comment: "")))
    }
}
