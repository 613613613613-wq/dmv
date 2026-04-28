import Foundation
#if canImport(AVFoundation)
import AVFoundation

/// Wraps `AVSpeechSynthesizer` for question/explanation narration.
/// Uses the system TTS voices — no network, no API costs, no third-party SDK.
public final class AudioNarrator {
    private let synthesizer = AVSpeechSynthesizer()
    public var rate: Float = AVSpeechUtteranceDefaultSpeechRate

    public init() {}

    public func speak(_ text: String, language: String = "en-US") {
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: language) ?? AVSpeechSynthesisVoice(language: "en-US")
        utterance.rate = rate
        synthesizer.stopSpeaking(at: .immediate)
        synthesizer.speak(utterance)
    }

    public func stop() {
        synthesizer.stopSpeaking(at: .immediate)
    }

    public var isSpeaking: Bool { synthesizer.isSpeaking }
}
#else
public final class AudioNarrator {
    public init() {}
    public func speak(_ text: String, language: String = "en-US") {}
    public func stop() {}
    public var isSpeaking: Bool { false }
}
#endif
