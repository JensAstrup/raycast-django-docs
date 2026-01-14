import axios from "axios";
import { fetchPageContent, fetchDocEntries } from "../django-docs";
import { fetchSitemap } from "../sitemap";
import { filterTopicsUrls, getSectionParentUrl } from "../../utils/url-filters";
import {
  createTurndownService,
  resolveRelativeUrls,
  removeHeaderLinks,
  stripPilcrows,
} from "../../utils/html-to-markdown";

jest.mock("axios");
jest.mock("../sitemap");
jest.mock("../../utils/url-filters");
jest.mock("../../utils/html-to-markdown");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedFetchSitemap = fetchSitemap as jest.MockedFunction<typeof fetchSitemap>;
const mockedFilterTopicsUrls = filterTopicsUrls as jest.MockedFunction<typeof filterTopicsUrls>;
const mockedGetSectionParentUrl = getSectionParentUrl as jest.MockedFunction<typeof getSectionParentUrl>;
const mockedCreateTurndownService = createTurndownService as jest.MockedFunction<typeof createTurndownService>;
const mockedResolveRelativeUrls = resolveRelativeUrls as jest.MockedFunction<typeof resolveRelativeUrls>;
const mockedRemoveHeaderLinks = removeHeaderLinks as jest.MockedFunction<typeof removeHeaderLinks>;
const mockedStripPilcrows = stripPilcrows as jest.MockedFunction<typeof stripPilcrows>;

describe("django-docs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchPageContent", () => {
    const testUrl = "https://docs.djangoproject.com/en/dev/topics/db/models/";

    it("should fetch and parse page content with both navigation links", async () => {
      const htmlContent = `
        <html>
          <head><title>Models | Django</title></head>
          <body>
            <nav aria-labelledby="browse-header">
              <a rel="prev" href="../intro/">Previous</a>
              <a rel="next" href="../queries/">Next</a>
            </nav>
            <h1>Models ¶</h1>
            <div id="docs-content">
              <p>This is the content</p>
              <a href="/en/dev/ref/models/fields/">Relative link</a>
            </div>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: htmlContent });
      mockedStripPilcrows.mockImplementation((text) => text.replace(/¶/g, "").trim());
      mockedCreateTurndownService.mockReturnValue({
        turndown: jest.fn().mockReturnValue("This is the content\n\n[Relative link](/en/dev/ref/models/fields/)"),
      } as unknown as ReturnType<typeof createTurndownService>);

      const result = await fetchPageContent(testUrl);

      expect(mockedAxios.get).toHaveBeenCalledWith(testUrl);
      expect(mockedRemoveHeaderLinks).toHaveBeenCalled();
      expect(mockedResolveRelativeUrls).toHaveBeenCalled();
      expect(result.title).toBe("Models");
      expect(result.content).toContain("This is the content");
      expect(result.prevUrl).toBe("https://docs.djangoproject.com/en/dev/topics/db/intro/");
      expect(result.nextUrl).toBe("https://docs.djangoproject.com/en/dev/topics/db/queries/");
    });

    it("should handle fallback navigation when primary navigation is missing", async () => {
      const htmlContent = `
        <html>
          <body>
            <nav aria-labelledby="browse-header"></nav>
            <nav class="browse-horizontal" aria-labelledby="browse-horizontal-header">
              <div class="left"><a rel="prev" href="../fallback-prev/">Previous</a></div>
              <div class="right"><a rel="next" href="../fallback-next/">Next</a></div>
            </nav>
            <h1>Test Page</h1>
            <div id="docs-content"><p>Content</p></div>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: htmlContent });
      mockedStripPilcrows.mockImplementation((text) => text.replace(/¶/g, "").trim());
      mockedCreateTurndownService.mockReturnValue({
        turndown: jest.fn().mockReturnValue("Content"),
      } as unknown as ReturnType<typeof createTurndownService>);

      const result = await fetchPageContent(testUrl);

      expect(result.prevUrl).toBe("https://docs.djangoproject.com/en/dev/topics/db/fallback-prev/");
      expect(result.nextUrl).toBe("https://docs.djangoproject.com/en/dev/topics/db/fallback-next/");
    });

    it("should handle missing navigation links", async () => {
      const htmlContent = `
        <html>
          <body>
            <nav aria-labelledby="browse-header"></nav>
            <h1>First Page</h1>
            <div id="docs-content"><p>Content</p></div>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: htmlContent });
      mockedStripPilcrows.mockImplementation((text) => text.replace(/¶/g, "").trim());
      mockedCreateTurndownService.mockReturnValue({
        turndown: jest.fn().mockReturnValue("Content"),
      } as unknown as ReturnType<typeof createTurndownService>);

      const result = await fetchPageContent(testUrl);

      expect(result.prevUrl).toBeNull();
      expect(result.nextUrl).toBeNull();
    });

    it("should handle missing h1 tag with fallback title", async () => {
      const htmlContent = `
        <html>
          <body>
            <nav aria-labelledby="browse-header"></nav>
            <div id="docs-content"><p>Content</p></div>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: htmlContent });
      mockedStripPilcrows.mockImplementation((text) => text.replace(/¶/g, "").trim());
      mockedCreateTurndownService.mockReturnValue({
        turndown: jest.fn().mockReturnValue("Content"),
      } as unknown as ReturnType<typeof createTurndownService>);

      const result = await fetchPageContent(testUrl);

      expect(result.title).toBe("Untitled");
    });

    it("should fallback to .body selector when #docs-content is missing", async () => {
      const htmlContent = `
        <html>
          <body>
            <h1>Test</h1>
            <div class="body"><p>Body content</p></div>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: htmlContent });
      mockedStripPilcrows.mockImplementation((text) => text.replace(/¶/g, ""));
      mockedCreateTurndownService.mockReturnValue({
        turndown: jest.fn().mockReturnValue("Body content"),
      } as unknown as ReturnType<typeof createTurndownService>);

      const result = await fetchPageContent(testUrl);

      expect(result.content).toBe("Body content");
    });

    it("should fallback to article selector when both #docs-content and .body are missing", async () => {
      const htmlContent = `
        <html>
          <body>
            <h1>Test</h1>
            <article><p>Article content</p></article>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: htmlContent });
      mockedStripPilcrows.mockImplementation((text) => text.replace(/¶/g, ""));
      mockedCreateTurndownService.mockReturnValue({
        turndown: jest.fn().mockReturnValue("Article content"),
      } as unknown as ReturnType<typeof createTurndownService>);

      const result = await fetchPageContent(testUrl);

      expect(result.content).toBe("Article content");
    });

    it("should handle empty content gracefully", async () => {
      const htmlContent = `
        <html>
          <body>
            <h1>Empty Page</h1>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: htmlContent });
      mockedStripPilcrows.mockImplementation((text) => text.replace(/¶/g, ""));
      mockedCreateTurndownService.mockReturnValue({
        turndown: jest.fn().mockReturnValue(""),
      } as unknown as ReturnType<typeof createTurndownService>);

      const result = await fetchPageContent(testUrl);

      expect(result.content).toBe("");
      expect(result.title).toBe("Empty Page");
    });

    it("should strip pilcrows from title and content", async () => {
      const htmlContent = `
        <html>
          <body>
            <h1>Models ¶</h1>
            <div id="docs-content"><p>Content ¶</p></div>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: htmlContent });
      mockedStripPilcrows.mockImplementation((text) => text.replace(/¶/g, "").trim());
      mockedCreateTurndownService.mockReturnValue({
        turndown: jest.fn().mockReturnValue("Content ¶"),
      } as unknown as ReturnType<typeof createTurndownService>);

      const result = await fetchPageContent(testUrl);

      expect(mockedStripPilcrows).toHaveBeenCalled();
      expect(result.title).toBe("Models");
    });

    it("should resolve relative URLs correctly", async () => {
      const htmlContent = `
        <html>
          <body>
            <h1>Test</h1>
            <div id="docs-content"><p>Content</p></div>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: htmlContent });
      mockedStripPilcrows.mockImplementation((text) => text);
      mockedCreateTurndownService.mockReturnValue({
        turndown: jest.fn().mockReturnValue("Content"),
      } as unknown as ReturnType<typeof createTurndownService>);

      await fetchPageContent(testUrl);

      expect(mockedResolveRelativeUrls).toHaveBeenCalledWith(expect.anything(), testUrl);
    });

    it("should handle axios errors", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Network error"));

      await expect(fetchPageContent(testUrl)).rejects.toThrow("Network error");
    });
  });

  describe("fetchDocEntries", () => {
    beforeEach(() => {
      mockedStripPilcrows.mockImplementation((text) => text.replace(/¶/g, "").trim());
      mockedCreateTurndownService.mockReturnValue({
        turndown: jest.fn().mockReturnValue("Mocked content"),
      } as unknown as ReturnType<typeof createTurndownService>);
    });

    it("should fetch and process multiple doc entries", async () => {
      const urls = [
        "https://docs.djangoproject.com/en/dev/topics/db/models/",
        "https://docs.djangoproject.com/en/dev/topics/db/queries/",
        "https://docs.djangoproject.com/en/dev/topics/db/",
      ];

      mockedFetchSitemap.mockResolvedValueOnce([...urls, "https://docs.djangoproject.com/en/dev/other/"]);
      mockedFilterTopicsUrls.mockReturnValueOnce(urls);

      const mockHtml = (title: string) => `
        <html>
          <body>
            <nav aria-labelledby="browse-header">
              <a rel="prev" href="../prev/">Previous</a>
              <a rel="next" href="../next/">Next</a>
            </nav>
            <h1>${title}</h1>
            <div id="docs-content"><p>Content</p></div>
          </body>
        </html>
      `;

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockHtml("Models") })
        .mockResolvedValueOnce({ data: mockHtml("Queries") })
        .mockResolvedValueOnce({ data: mockHtml("Database") });

      mockedGetSectionParentUrl
        .mockReturnValueOnce("https://docs.djangoproject.com/en/dev/topics/db/")
        .mockReturnValueOnce("https://docs.djangoproject.com/en/dev/topics/db/")
        .mockReturnValueOnce(null);

      const entries = await fetchDocEntries();

      expect(mockedFetchSitemap).toHaveBeenCalled();
      expect(mockedFilterTopicsUrls).toHaveBeenCalled();
      expect(entries).toHaveLength(3);
      expect(entries[0].title).toBe("Models");
      expect(entries[1].title).toBe("Queries");
      expect(entries[2].title).toBe("Database");
    });

    it("should establish parent-child relationships correctly", async () => {
      const urls = [
        "https://docs.djangoproject.com/en/dev/topics/db/",
        "https://docs.djangoproject.com/en/dev/topics/db/models/",
      ];

      mockedFetchSitemap.mockResolvedValueOnce(urls);
      mockedFilterTopicsUrls.mockReturnValueOnce(urls);

      const mockHtml = (title: string) => `
        <html>
          <body>
            <h1>${title}</h1>
            <div id="docs-content"><p>Content</p></div>
          </body>
        </html>
      `;

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockHtml("Database") })
        .mockResolvedValueOnce({ data: mockHtml("Models") });

      mockedGetSectionParentUrl
        .mockReturnValueOnce(null)
        .mockReturnValueOnce("https://docs.djangoproject.com/en/dev/topics/db/");

      const entries = await fetchDocEntries();

      expect(entries[0].parent).toBeNull();
      expect(entries[1].parent).toBe(entries[0]);
    });

    it("should establish previous-next relationships from page content", async () => {
      const urls = [
        "https://docs.djangoproject.com/en/dev/topics/db/models/",
        "https://docs.djangoproject.com/en/dev/topics/db/queries/",
      ];

      mockedFetchSitemap.mockResolvedValueOnce(urls);
      mockedFilterTopicsUrls.mockReturnValueOnce(urls);

      const mockHtml1 = `
        <html>
          <body>
            <nav aria-labelledby="browse-header">
              <a rel="next" href="../queries/">Next</a>
            </nav>
            <h1>Models</h1>
            <div id="docs-content"><p>Content</p></div>
          </body>
        </html>
      `;

      const mockHtml2 = `
        <html>
          <body>
            <nav aria-labelledby="browse-header">
              <a rel="prev" href="../models/">Previous</a>
            </nav>
            <h1>Queries</h1>
            <div id="docs-content"><p>Content</p></div>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: mockHtml1 }).mockResolvedValueOnce({ data: mockHtml2 });

      mockedGetSectionParentUrl.mockReturnValue(null);

      const entries = await fetchDocEntries();

      expect(entries[0].next).toBe(entries[1]);
      expect(entries[1].previous).toBe(entries[0]);
    });

    it("should handle entries with no parent when parent URL not in entry list", async () => {
      const urls = ["https://docs.djangoproject.com/en/dev/topics/db/models/"];

      mockedFetchSitemap.mockResolvedValueOnce(urls);
      mockedFilterTopicsUrls.mockReturnValueOnce(urls);

      const mockHtml = `
        <html>
          <body>
            <h1>Models</h1>
            <div id="docs-content"><p>Content</p></div>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: mockHtml });
      mockedGetSectionParentUrl.mockReturnValueOnce("https://docs.djangoproject.com/en/dev/topics/db/");

      const entries = await fetchDocEntries();

      expect(entries[0].parent).toBeNull();
    });

    it("should handle entries with no previous/next when URLs not in entry list", async () => {
      const urls = ["https://docs.djangoproject.com/en/dev/topics/db/models/"];

      mockedFetchSitemap.mockResolvedValueOnce(urls);
      mockedFilterTopicsUrls.mockReturnValueOnce(urls);

      const mockHtml = `
        <html>
          <body>
            <nav aria-labelledby="browse-header">
              <a rel="prev" href="../intro/">Previous</a>
              <a rel="next" href="../queries/">Next</a>
            </nav>
            <h1>Models</h1>
            <div id="docs-content"><p>Content</p></div>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: mockHtml });
      mockedGetSectionParentUrl.mockReturnValue(null);

      const entries = await fetchDocEntries();

      expect(entries[0].previous).toBeNull();
      expect(entries[0].next).toBeNull();
    });

    it("should handle errors when fetching individual pages", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const urls = [
        "https://docs.djangoproject.com/en/dev/topics/db/models/",
        "https://docs.djangoproject.com/en/dev/topics/db/queries/",
      ];

      mockedFetchSitemap.mockResolvedValueOnce(urls);
      mockedFilterTopicsUrls.mockReturnValueOnce(urls);

      mockedAxios.get.mockRejectedValueOnce(new Error("Network error")).mockResolvedValueOnce({
        data: `
          <html>
            <body>
              <h1>Queries</h1>
              <div id="docs-content"><p>Content</p></div>
            </body>
          </html>
        `,
      });

      mockedGetSectionParentUrl.mockReturnValue(null);

      const entries = await fetchDocEntries();

      expect(entries).toHaveLength(1);
      expect(entries[0].title).toBe("Queries");
      expect(consoleErrorSpy).toHaveBeenCalledWith(`Failed to fetch ${urls[0]}:`, expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it("should handle empty sitemap", async () => {
      mockedFetchSitemap.mockResolvedValueOnce([]);
      mockedFilterTopicsUrls.mockReturnValueOnce([]);

      const entries = await fetchDocEntries();

      expect(entries).toHaveLength(0);
    });

    it("should handle sitemap with no matching URLs after filtering", async () => {
      mockedFetchSitemap.mockResolvedValueOnce([
        "https://docs.djangoproject.com/en/dev/other/",
        "https://docs.djangoproject.com/en/dev/faq/",
      ]);
      mockedFilterTopicsUrls.mockReturnValueOnce([]);

      const entries = await fetchDocEntries();

      expect(entries).toHaveLength(0);
    });

    it("should maintain proper URL mapping for relationships", async () => {
      const urls = [
        "https://docs.djangoproject.com/en/dev/topics/a/",
        "https://docs.djangoproject.com/en/dev/topics/b/",
        "https://docs.djangoproject.com/en/dev/topics/c/",
      ];

      mockedFetchSitemap.mockResolvedValueOnce(urls);
      mockedFilterTopicsUrls.mockReturnValueOnce(urls);

      const mockHtml = (title: string, prev?: string, next?: string) => `
        <html>
          <body>
            <nav aria-labelledby="browse-header">
              ${prev ? `<a rel="prev" href="${prev}">Previous</a>` : ""}
              ${next ? `<a rel="next" href="${next}">Next</a>` : ""}
            </nav>
            <h1>${title}</h1>
            <div id="docs-content"><p>Content</p></div>
          </body>
        </html>
      `;

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockHtml("A", undefined, "../b/") })
        .mockResolvedValueOnce({ data: mockHtml("B", "../a/", "../c/") })
        .mockResolvedValueOnce({ data: mockHtml("C", "../b/", undefined) });

      mockedGetSectionParentUrl.mockReturnValue(null);

      const entries = await fetchDocEntries();

      expect(entries[0].next).toBe(entries[1]);
      expect(entries[1].previous).toBe(entries[0]);
      expect(entries[1].next).toBe(entries[2]);
      expect(entries[2].previous).toBe(entries[1]);
    });

    it("should process all entries sequentially", async () => {
      const urls = [
        "https://docs.djangoproject.com/en/dev/topics/db/models/",
        "https://docs.djangoproject.com/en/dev/topics/db/queries/",
      ];

      mockedFetchSitemap.mockResolvedValueOnce(urls);
      mockedFilterTopicsUrls.mockReturnValueOnce(urls);

      const mockHtml = (title: string) => `
        <html>
          <body>
            <h1>${title}</h1>
            <div id="docs-content"><p>Content</p></div>
          </body>
        </html>
      `;

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockHtml("Models") })
        .mockResolvedValueOnce({ data: mockHtml("Queries") });

      mockedGetSectionParentUrl.mockReturnValue(null);

      await fetchDocEntries();

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(mockedAxios.get).toHaveBeenNthCalledWith(1, urls[0]);
      expect(mockedAxios.get).toHaveBeenNthCalledWith(2, urls[1]);
    });
  });
});
