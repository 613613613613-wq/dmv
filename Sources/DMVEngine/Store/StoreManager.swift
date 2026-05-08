import Foundation
#if canImport(StoreKit)
import StoreKit

/// Buy-once purchase model. No subscriptions, no auto-renewing.
/// One base purchase unlocks the state pack; optional non-consumable IAPs add Pro features.
@MainActor
public final class StoreManager: ObservableObject {
    public enum ProductTier: String, CaseIterable, Sendable {
        case base    // unlock the state pack itself
        case pro     // AI tutor, all-language audio, advanced stats
        case cdl     // V2 — CDL question pack add-on
    }

    @Published public private(set) var purchased: Set<String> = []
    @Published public private(set) var products: [Product] = []

    public let productIDs: [ProductTier: String]

    private var updatesTask: Task<Void, Never>?

    public init(productIDs: [ProductTier: String]) {
        self.productIDs = productIDs
        // Long-running listener for out-of-band entitlement changes:
        // family sharing grants, Ask-to-Buy approvals, refunds/revocations,
        // and any transaction Apple completes outside the active purchase() call.
        // Without this, deferred and revoked purchases silently desync from `purchased`.
        self.updatesTask = Task { [weak self] in
            for await result in Transaction.updates {
                await self?.apply(result)
            }
        }
    }

    deinit {
        updatesTask?.cancel()
    }

    public func loadEntitlements() async {
        var owned: Set<String> = []
        for await result in Transaction.currentEntitlements {
            if case .verified(let tx) = result, tx.revocationDate == nil {
                owned.insert(tx.productID)
            }
        }
        self.purchased = owned
    }

    private func apply(_ result: VerificationResult<Transaction>) async {
        guard case .verified(let tx) = result else { return }
        if tx.revocationDate != nil {
            purchased.remove(tx.productID)
        } else {
            purchased.insert(tx.productID)
        }
        await tx.finish()
    }

    public func loadProducts() async throws {
        let ids = Array(productIDs.values)
        guard !ids.isEmpty else { return }
        self.products = try await Product.products(for: ids)
    }

    public func purchase(_ tier: ProductTier) async throws -> Bool {
        guard let id = productIDs[tier],
              let product = products.first(where: { $0.id == id }) else { return false }
        let result = try await product.purchase()
        switch result {
        case .success(let verification):
            if case .verified(let tx) = verification {
                purchased.insert(tx.productID)
                await tx.finish()
                return true
            }
            return false
        case .userCancelled, .pending:
            return false
        @unknown default:
            return false
        }
    }

    public func restore() async throws {
        try await AppStore.sync()
        await loadEntitlements()
    }

    public func owns(_ tier: ProductTier) -> Bool {
        guard let id = productIDs[tier] else { return false }
        return purchased.contains(id)
    }
}
#endif
