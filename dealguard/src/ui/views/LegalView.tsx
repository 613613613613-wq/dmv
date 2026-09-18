import { useParams } from "react-router-dom";
import privacy from "../../../docs/PRIVACY_POLICY.md?raw";
import terms from "../../../docs/TERMS_OF_SERVICE.md?raw";
import compliance from "../../../docs/COMPLIANCE.md?raw";
import { Empty, Screen } from "../components";
import { Markdown } from "../markdown";

const DOCS: Record<string, { title: string; text: string }> = {
  privacy: { title: "Privacy policy", text: privacy },
  terms: { title: "Terms of service", text: terms },
  compliance: { title: "Recording-consent guide", text: compliance },
};

export function LegalView() {
  const { doc } = useParams();
  const d = doc ? DOCS[doc] : undefined;
  return (
    <Screen title={d?.title ?? "Legal"} back={true} testId="legal">
      <div className="mt-2 pb-6">{d ? <Markdown text={d.text} /> : <Empty title="Document not found" />}</div>
    </Screen>
  );
}
