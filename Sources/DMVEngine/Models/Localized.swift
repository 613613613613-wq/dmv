import Foundation

/// A string with translations keyed by ISO 639-1 language code.
///
/// JSON shape: `{ "en": "...", "es": "...", "ht": "..." }`.
/// Always falls back to English if the requested language is missing.
public struct Localized: Codable, Hashable, Sendable {
    public let translations: [String: String]

    public init(_ translations: [String: String]) {
        self.translations = translations
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        self.translations = try container.decode([String: String].self)
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(translations)
    }

    /// Resolves the best available translation for a language code, falling back to English.
    public func value(for language: String) -> String {
        translations[language] ?? translations["en"] ?? translations.values.first ?? ""
    }
}
