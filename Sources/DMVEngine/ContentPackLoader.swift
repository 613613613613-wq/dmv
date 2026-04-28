import Foundation

public enum ContentPackError: Error, CustomStringConvertible {
    case missingResource(String)
    case decodingFailed(String, underlying: Error)
    case unknownState(String)

    public var description: String {
        switch self {
        case .missingResource(let name):
            return "Content pack resource '\(name)' not found in bundle."
        case .decodingFailed(let name, let err):
            return "Failed to decode content pack '\(name)': \(err)"
        case .unknownState(let code):
            return "No content pack registered for state code '\(code)'."
        }
    }
}

public struct ContentPackLoader {
    private let bundle: Bundle

    public init(bundle: Bundle = .main) {
        self.bundle = bundle
    }

    /// Loads the bundled content pack matching the given state code (e.g. "FL", "TX").
    /// Build schemes set the `STATE_CODE` Info.plist key to control which pack ships per SKU.
    public func load(stateCode: String) throws -> ContentPack {
        let resourceName = stateCode.lowercased()
        guard let url = bundle.url(forResource: resourceName, withExtension: "json") else {
            throw ContentPackError.missingResource(resourceName + ".json")
        }
        return try load(from: url)
    }

    public func load(from url: URL) throws -> ContentPack {
        let data = try Data(contentsOf: url)
        do {
            return try JSONDecoder().decode(ContentPack.self, from: data)
        } catch {
            throw ContentPackError.decodingFailed(url.lastPathComponent, underlying: error)
        }
    }

    /// Reads the active state code from the app's Info.plist `STATE_CODE` key.
    /// Returns nil if absent — caller decides how to handle (engine tests use direct URLs).
    public static func activeStateCode(bundle: Bundle = .main) -> String? {
        bundle.object(forInfoDictionaryKey: "STATE_CODE") as? String
    }
}
