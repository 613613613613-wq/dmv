import SwiftUI
import DMVEngine

struct SettingsView: View {
    @AppStorage("dmv.dyslexiaMode") private var dyslexiaMode = false
    @AppStorage("dmv.audioNarration") private var audioNarration = true
    @AppStorage("dmv.uiLanguage") private var uiLanguage = "en"
    @Environment(\.contentPack) private var pack

    var body: some View {
        Form {
            Section("Accessibility") {
                Toggle("Dyslexia-friendly font", isOn: $dyslexiaMode)
                Toggle("Audio narration", isOn: $audioNarration)
            }
            if let pack {
                Section("Language") {
                    Picker("UI language", selection: $uiLanguage) {
                        ForEach(pack.languages.ui, id: \.self) { code in
                            Text(displayName(for: code)).tag(code)
                        }
                    }
                    if let note = pack.languages.note {
                        Text(note).font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
            Section("Privacy") {
                Label("No analytics. No accounts. No tracking.", systemImage: "lock.fill")
                    .font(.caption)
                Text("All progress is stored locally on this device. Nothing is sent off-device.")
                    .font(.caption2).foregroundStyle(.secondary)
            }
            Section("About") {
                if let pack {
                    LabeledContent("State", value: pack.name)
                    LabeledContent("Handbook version", value: pack.handbook.version)
                    LabeledContent("Last reviewed", value: pack.handbook.lastReviewed)
                }
            }
        }
        .navigationTitle("Settings")
    }

    private func displayName(for code: String) -> String {
        Locale.current.localizedString(forLanguageCode: code) ?? code.uppercased()
    }
}
