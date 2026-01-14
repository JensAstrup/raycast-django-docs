import { ActionPanel, Detail, Action } from "@raycast/api";
import { DocEntry } from "../types/DocEntry";

interface DocDetailProps {
  entry: DocEntry;
}

export function DocDetail({ entry }: DocDetailProps) {
  return (
    <Detail
      markdown={`# ${entry.title}\n\n${entry.content}`}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser url={entry.url} title="Open in Browser" />
          <Action.CopyToClipboard content={entry.url} title="Copy URL" />
        </ActionPanel>
      }
      metadata={
        entry.parent || entry.previous || entry.next ? (
          <Detail.Metadata>
            {entry.parent && <Detail.Metadata.Link title="Parent" target={entry.parent.url} text={entry.parent.title} />}
            {entry.previous && <Detail.Metadata.Link title="Previous" target={entry.previous.url} text={entry.previous.title} />}
            {entry.next && <Detail.Metadata.Link title="Next" target={entry.next.url} text={entry.next.title} />}
          </Detail.Metadata>
        ) : undefined
      }
    />
  );
}
