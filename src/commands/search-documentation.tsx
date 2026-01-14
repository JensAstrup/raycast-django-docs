import { ActionPanel, List, Action, Icon, showToast, Toast } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useState, useMemo } from "react";
import { DocEntry } from "../types/DocEntry";
import { fetchDocEntries } from "../services/django-docs";
import { writeCache, readCache } from "../services/cache";
import { DocDetail } from "../components/DocDetail";
import { DjangoVersion } from "../constants";

/**
 * Serializable format for caching - stores URLs instead of circular object references.
 */
interface SerializableEntry {
  url: string;
  title: string;
  content: string;
  parentUrl: string | null;
  previousUrl: string | null;
  nextUrl: string | null;
}

/**
 * Convert DocEntry[] to serializable format (no circular refs).
 */
function serializeEntries(entries: DocEntry[]): SerializableEntry[] {
  return entries.map((e) => ({
    url: e.url,
    title: e.title,
    content: e.content,
    parentUrl: e.parent?.url ?? null,
    previousUrl: e.previous?.url ?? null,
    nextUrl: e.next?.url ?? null,
  }));
}

/**
 * Reconstruct DocEntry[] with circular references from serializable format.
 */
function deserializeEntries(serialized: SerializableEntry[]): DocEntry[] {
  const entries: DocEntry[] = serialized.map((s) => ({
    url: s.url,
    title: s.title,
    content: s.content,
    parent: null,
    previous: null,
    next: null,
  }));

  const entryByUrl = new Map(entries.map((e) => [e.url, e]));

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const s = serialized[i];
    entry.parent = s.parentUrl ? (entryByUrl.get(s.parentUrl) ?? null) : null;
    entry.previous = s.previousUrl ? (entryByUrl.get(s.previousUrl) ?? null) : null;
    entry.next = s.nextUrl ? (entryByUrl.get(s.nextUrl) ?? null) : null;
  }

  return entries;
}

async function loadDocEntries(version: DjangoVersion): Promise<SerializableEntry[]> {
  // Try loading from cache first
  const cachedEntries = readCache(version);
  if (cachedEntries && cachedEntries.length > 0) {
    return serializeEntries(cachedEntries);
  }

  // No cache - fetch fresh
  const toast = await showToast({ style: Toast.Style.Animated, title: "Fetching documentation..." });
  const docEntries = await fetchDocEntries();
  toast.hide();

  // Write to cache
  writeCache(version, docEntries);
  await showToast({ style: Toast.Style.Success, title: `Loaded ${docEntries.length} documentation pages` });

  return serializeEntries(docEntries);
}

export default function SearchDocumentationCommand() {
  const [version, setVersion] = useState<DjangoVersion>("6.0");

  const { data: serializedEntries = [], isLoading } = useCachedPromise(loadDocEntries, [version], {
    keepPreviousData: true,
    onError: (error) => {
      console.error("Error loading docs:", error);
      showToast({ style: Toast.Style.Failure, title: "Failed to load documentation" });
    },
  });

  // Reconstruct circular references from serialized data
  const entries = useMemo(() => deserializeEntries(serializedEntries), [serializedEntries]);

  const VersionDropdown = () => {
    return (
      <List.Dropdown
        tooltip="Select a version"
        value={version}
        onChange={(newValue: string) => setVersion(newValue as DjangoVersion)}
      >
        <List.Dropdown.Item title="6.0" value="6.0" />
        <List.Dropdown.Item title="dev" value="dev" />
        <List.Dropdown.Item title="5.1" value="5.1" />
        <List.Dropdown.Item title="5.0" value="5.0" />
        <List.Dropdown.Item title="4.2" value="4.2" />
      </List.Dropdown>
    );
  };

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search Django Documentation..."
      searchBarAccessory={<VersionDropdown />}
    >
      {entries.map((entry) => (
        <List.Item
          key={entry.url}
          icon={Icon.Document}
          title={entry.title}
          subtitle={entry.parent?.title ?? ""}
          actions={
            <ActionPanel>
              <Action.Push title="View Documentation" icon={Icon.Eye} target={<DocDetail entry={entry} />} />
              <Action.OpenInBrowser url={entry.url} title="Open in Browser" />
              <Action.CopyToClipboard content={entry.url} title="Copy URL" />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
