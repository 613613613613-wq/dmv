# Recording and consent compliance

Deal Guard transcribes conversations in Live mode. Recording, transcribing or
intercepting a conversation is regulated everywhere, and the rules depend on
where each participant is. This document describes the guardrails the app
ships with and what the user must still do.

**This is product guidance, not legal advice.** Statutes change and their
interpretation depends on facts (phone vs in-person, business vs personal,
where each party is located). Have counsel review before relying on any of it.

## One-party vs all-party consent

Under the federal Wiretap Act (18 U.S.C. § 2511(2)(d)) one participant's
consent suffices, but states may be stricter. The app treats the following as
**all-party consent** jurisdictions and applies the strict flow there:

| Jurisdiction | Statute | Note |
|---|---|---|
| California | Cal. Penal Code § 632 | Applies to "confidential communications"; business calls are routinely treated as covered. |
| Connecticut | Conn. Gen. Stat. § 52-570d (civil); § 53a-189 | All-party for telephone recordings in the civil statute. |
| Delaware | Del. Code tit. 11, § 2402; tit. 11, § 1335 | Treated as all-party in practice. |
| Florida | Fla. Stat. § 934.03 | All-party; oral, wire and electronic communications. |
| Illinois | 720 ILCS 5/14-2 | All-party for private conversations. |
| Maryland | Md. Code, Cts. & Jud. Proc. § 10-402 | All-party. |
| Massachusetts | Mass. Gen. Laws ch. 272, § 99 | Prohibits secret recording regardless of consent from one party. |
| Michigan | Mich. Comp. Laws § 750.539c | Treated as all-party for third-party recording; participants' rights disputed — app applies strict. |
| Montana | Mont. Code Ann. § 45-8-213 | All-party with exceptions for public officials. |
| Nevada | Nev. Rev. Stat. § 200.620 | All-party for wire communications per state supreme court. |
| New Hampshire | N.H. Rev. Stat. Ann. § 570-A:2 | All-party. |
| Oregon | Or. Rev. Stat. § 165.540 | All-party for in-person; one-party for telephone — app applies strict. |
| Pennsylvania | 18 Pa. Cons. Stat. § 5704 | All-party. |
| Washington | Wash. Rev. Code § 9.73.030 | All-party; announcement at the start of recording satisfies consent. |
| Outside the US | Varies (e.g. GDPR Art. 6/13, UK RIPA/IPA, Canada PIPEDA) | Treated as strict all-party. |

All other US states are treated as **one-party** jurisdictions: the user's
own consent is enough under state law, though disclosure is still
recommended. When participants are in different places, the app follows the
strictest jurisdiction selected.

## What the app does

1. **Pre-flight consent gate.** Live and Companion sessions cannot start until
   the user completes the pre-flight step: choose the jurisdiction(s) of the
   participants, read the reminder, and confirm.

   Reminder text shown in pre-flight:

   > Ensure counterparties are informed that an AI deal assistant is running
   > for transcription and record-keeping.

2. **Disclosure script.** In all-party jurisdictions the app shows a script
   for the host to read before the substantive conversation starts:

   > Before we start: I'm running Deal Guard, an AI deal assistant, for live
   > transcription and record-keeping on my side. Is everyone comfortable
   > proceeding?

   The host confirms "Disclosed" in the app. The confirmation and its
   timestamp are written to the session ledger so the memorandum records
   that the disclosure was made.

3. **Calendar-invite disclaimer.** A copyable paragraph for meeting invites
   so participants are informed in writing ahead of time:

   > Note: the host will use Deal Guard, an AI deal assistant, for live
   > transcription and record-keeping during this meeting. Audio is not
   > stored. Please let the host know before the meeting if you have any
   > concerns.

4. **Zero persistence.** Audio is held in memory only and discarded after
   transcription. The raw transcript is discarded when the memorandum is
   built. Only the structured ledger (typed assertions with verbatim
   snippets), terms and memoranda remain, on-device. This reduces, but does
   not remove, the recording-law exposure: transcription is still
   interception in most statutes.

5. **Speaker calibration and diarization** label who said what so the
   memorandum can distinguish the user's own statements from the
   counterparty's; it does not identify people by name.

6. **Demo mode** uses a scripted, fictional negotiation and never touches the
   microphone; it has no consent implications.

7. **Companion mode** receives cues from a desktop daemon. The daemon's
   audio handling is outside the phone app; the same disclosure obligations
   apply to whoever runs the daemon.

## What the user must do

- Determine where every participant is physically located and select the
  strictest applicable jurisdiction in pre-flight.
- In all-party jurisdictions (and everywhere as good practice): read the
  disclosure script at the start and obtain affirmative agreement from every
  participant; if anyone objects, stop the session.
- Send the calendar disclaimer with the invite when possible.
- Consider whether other rules apply: company policies, NDAs, bar or
  broker-dealer rules, and the counterparty's jurisdiction if abroad (GDPR
  requires a lawful basis and transparency for processing voices as personal
  data).
- Do not rely on the app to decide legality. Consult counsel for a
  jurisdiction that is not listed or for a cross-border call.
- Understand that using their own Deepgram key makes them the controller
  for the audio sent to Deepgram.

## Store-facing statements

- Apple: the microphone purpose string says the mic is used only in Live mode
  to transcribe the user's negotiation on the user's own speech-to-text
  account, and that audio is not stored.
- Google Play: `RECORD_AUDIO` is declared as core functionality for Live
  mode; the Data Safety form declares audio as processed ephemerally and not
  collected. See `DATA_SAFETY.md`.

## Change log

| Date | Change |
|---|---|
| 2026-09-18 | Initial version for 1.0.0. |
