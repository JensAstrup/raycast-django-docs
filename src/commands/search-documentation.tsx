import { ActionPanel, List, Action, Icon, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { DocEntry } from "../types/DocEntry";
import { fetchDocEntries } from "../services/django-docs";
import { writeCache, readCache } from "../services/cache";
import { DocDetail } from "../components/DocDetail";
import { DjangoVersion } from "../constants";

export default function SearchDocumentationCommand() {
  const [entries, setEntries] = useState<DocEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [version, setVersion] = useState<DjangoVersion>("6.0");

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

  useEffect(() => {
    async function loadDocs() {
      try {
        // Try loading from cache first
        const cachedEntries = await readCache(version);

        if (cachedEntries && cachedEntries.length > 0) {
          // Cache hit - display immediately
          setEntries(cachedEntries);
          setIsLoading(false);
          return;
        }

        // No cache - fetch fresh
        const toast = await showToast({ style: Toast.Style.Animated, title: "Fetching documentation..." });
        const docEntries = await fetchDocEntries();
        toast.hide();

        setEntries(docEntries);
        setIsLoading(false);
        showToast({ style: Toast.Style.Success, title: `Loaded ${docEntries.length} documentation pages` });

        // Write to cache
        writeCache(version, docEntries);
      } catch (error) {
        console.error("Error loading docs:", error);
        showToast({ style: Toast.Style.Failure, title: "Failed to load documentation" });
        setIsLoading(false);
      }
    }

    loadDocs();
  }, [version]);

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
