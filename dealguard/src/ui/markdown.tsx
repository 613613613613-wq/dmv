import type { ReactNode } from "react";

/** Tiny markdown renderer for the in-app legal docs and memoranda (headings, lists, paragraphs, bold, tables). */
export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r/g, "").split("\n");
  const out: ReactNode[] = [];
  let list: string[] | null = null;
  let table: string[][] | null = null;
  const flush = () => {
    if (list) {
      out.push(
        <ul key={out.length} className="list-disc pl-5 space-y-1.5 my-3 text-[15px] leading-relaxed text-ink-100/90">
          {list.map((l, i) => (
            <li key={i}>{inline(l)}</li>
          ))}
        </ul>,
      );
      list = null;
    }
    if (table) {
      const [head, ...rows] = table;
      out.push(
        <div key={out.length} className="my-3 overflow-x-auto no-scrollbar">
          <table className="text-[13px] w-full border-collapse">
            <thead>
              <tr>
                {head.map((h, i) => (
                  <th key={i} className="text-left border-b border-ink-700 py-1.5 pr-3 text-ink-300 font-semibold">
                    {inline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j} className="border-b border-ink-800 py-1.5 pr-3 align-top">
                      {inline(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      table = null;
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^\s*\|.*\|\s*$/.test(line)) {
      const cells = line.trim().slice(1, -1).split("|").map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
      (table ??= []).push(cells);
      continue;
    }
    if (/^\s*[-*] /.test(line)) {
      if (table) flush();
      (list ??= []).push(line.replace(/^\s*[-*] /, ""));
      continue;
    }
    flush();
    if (!line.trim()) continue;
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const cls = level === 1 ? "text-[24px] font-extrabold mt-2 mb-3" : level === 2 ? "text-[18px] font-bold mt-6 mb-2" : "text-[15px] font-semibold mt-4 mb-1.5 text-ink-300";
      out.push(
        <div key={out.length} className={cls}>
          {inline(h[2])}
        </div>,
      );
      continue;
    }
    out.push(
      <p key={out.length} className="text-[15px] leading-relaxed text-ink-100/90 my-2.5">
        {inline(line)}
      </p>,
    );
  }
  flush();
  return <div>{out}</div>;
}

function inline(s: string): ReactNode {
  const parts: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|_(.+?)_|`(.+?)`|\[(.+?)\]\((.+?)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    if (m[1]) parts.push(<strong key={m.index}>{m[1]}</strong>);
    else if (m[2]) parts.push(<em key={m.index}>{m[2]}</em>);
    else if (m[3]) parts.push(<code key={m.index} className="text-[13px] bg-ink-800 rounded px-1">{m[3]}</code>);
    else if (m[4])
      parts.push(
        <a key={m.index} href={m[5]} className="text-link underline" target="_blank" rel="noreferrer">
          {m[4]}
        </a>,
      );
    last = m.index + m[0].length;
  }
  if (last < s.length) parts.push(s.slice(last));
  return parts;
}
