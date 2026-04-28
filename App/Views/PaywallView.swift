import SwiftUI
import DMVEngine

/// Buy-once paywall — never a subscription. Restores existing purchases.
struct PaywallView: View {
    let title: String
    let bullets: [String]
    let priceLabel: String
    let onPurchase: () async -> Void
    let onRestore: () async -> Void

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "key.fill").font(.system(size: 48)).foregroundStyle(.tint)
            Text(title).font(.title2).fontWeight(.bold)
            VStack(alignment: .leading, spacing: 8) {
                ForEach(bullets, id: \.self) { b in
                    Label(b, systemImage: "checkmark.circle.fill")
                        .foregroundStyle(.primary)
                }
            }
            Spacer().frame(height: 8)
            Button { Task { await onPurchase() } } label: {
                Text(priceLabel).frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            Button("Restore Purchase") { Task { await onRestore() } }
                .font(.footnote)
            Text("One-time purchase. No subscription. No ads.")
                .font(.caption2).foregroundStyle(.secondary)
        }
        .padding(32)
    }
}
