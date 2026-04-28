import SwiftUI
import DMVEngine

/// Small streak chip rendered in the home screen header. Quietly motivating, not loud.
/// 0-day streaks render nothing — no nag.
struct StreakBadge: View {
    let streak: Int

    var body: some View {
        if streak > 0 {
            HStack(spacing: 6) {
                Image(systemName: "flame.fill")
                    .foregroundStyle(.orange)
                Text("\(streak)-day streak")
                    .font(.caption)
                    .fontWeight(.semibold)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(Color.orange.opacity(0.12))
            .clipShape(Capsule())
            .accessibilityLabel("\(streak) day study streak")
        }
    }
}
