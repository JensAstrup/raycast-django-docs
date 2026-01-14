import axios from "axios";
import * as cheerio from "cheerio";
import { DocEntry } from "../types/DocEntry";
import { fetchSitemap } from "./sitemap";
import { filterTopicsUrls, getSectionParentUrl } from "../utils/url-filters";
import { createTurndownService, resolveRelativeUrls, removeHeaderLinks, stripPilcrows } from "../utils/html-to-markdown";

interface PageContent {
  title: string;
  content: string;
  prevUrl: string | null;
  nextUrl: string | null;
}

export async function fetchPageContent(url: string): Promise<PageContent> {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  // Extract prev/next from the Browse navigation before any modifications
  const browseNav = $('nav[aria-labelledby="browse-header"]');
  let prevHref = browseNav.find('a[rel="prev"]').attr("href");
  let nextHref = browseNav.find('a[rel="next"]').attr("href");
  const fallbackNav = $('nav.browse-horizontal[aria-labelledby="browse-horizontal-header"]');
  console.log("url", url);
  // Use fallback values if primary navigation doesn't have them
  if (!prevHref) {
    prevHref = fallbackNav.find('.left a[rel="prev"]').attr("href");
  }
  if (!nextHref) {
    nextHref = fallbackNav.find('.right a[rel="next"]').attr("href");
  }
  console.log("prevHref", prevHref);
  console.log("nextHref", nextHref);
  // Resolve relative URLs to absolute
  const prevUrl = prevHref ? new URL(prevHref, url).href : null;
  const nextUrl = nextHref ? new URL(nextHref, url).href : null;

  console.log("prevUrl", prevUrl);
  console.log("nextUrl", nextUrl);
  // Clean up the HTML before extraction
  removeHeaderLinks($);
  resolveRelativeUrls($, url);

  const title = stripPilcrows($("h1").first().text().trim()) || "Untitled";
  const contentHtml = $("#docs-content").html() || $(".body").html() || $("article").html() || "";
  const turndownService = createTurndownService();
  const markdown = stripPilcrows(turndownService.turndown(contentHtml));

  return { title, content: markdown, prevUrl, nextUrl };
}

export async function fetchDocEntries(): Promise<DocEntry[]> {
  const allUrls = await fetchSitemap();
  const filteredUrls = filterTopicsUrls(allUrls);

  // Temporary storage for entries with raw URLs before linking
  const rawEntries: Array<{
    url: string;
    title: string;
    content: string;
    prevUrl: string | null;
    nextUrl: string | null;
  }> = [];

  for (let i = 0; i < filteredUrls.length; i++) {
    const url = filteredUrls[i];

    try {
      const { title, content, prevUrl, nextUrl } = await fetchPageContent(url);
      rawEntries.push({ url, title, content, prevUrl, nextUrl });
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error);
    }
  }

  // Create DocEntry objects with null references initially
  const entries: DocEntry[] = rawEntries.map((raw) => ({
    url: raw.url,
    title: raw.title,
    content: raw.content,
    parent: null,
    previous: null,
    next: null,
  }));

  // Build a map for O(1) lookups when linking references
  const entryByUrl = new Map<string, DocEntry>(entries.map((e) => [e.url, e]));

  // Link parent, prev, and next references
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const raw = rawEntries[i];

    // Parent: section top-level entry (e.g., /ref/class-based-views/ for all its children)
    const parentUrl = getSectionParentUrl(entry.url);
    entry.parent = parentUrl ? entryByUrl.get(parentUrl) ?? null : null;

    // Prev/Next: from Django's Browse navigation
    entry.previous = raw.prevUrl ? entryByUrl.get(raw.prevUrl) ?? null : null;
    entry.next = raw.nextUrl ? entryByUrl.get(raw.nextUrl) ?? null : null;
  }

  return entries;
}
