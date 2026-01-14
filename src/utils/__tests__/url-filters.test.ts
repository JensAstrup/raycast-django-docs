import { filterTopicsUrls, filterUrlsBySection, getSectionParentUrl } from "../url-filters";

describe("url-filters", () => {
  describe("filterTopicsUrls", () => {
    it("should filter URLs matching any pattern", () => {
      const urls = [
        "https://docs.djangoproject.com/en/dev/topics/auth/",
        "https://docs.djangoproject.com/en/dev/topics/db/models/",
        "https://docs.djangoproject.com/en/dev/ref/contrib/admin/",
        "https://docs.djangoproject.com/en/dev/ref/forms/api/fields/",
        "https://docs.djangoproject.com/en/dev/intro/tutorial01/",
        "https://example.com/",
      ];

      const filtered = filterTopicsUrls(urls);

      expect(filtered).toHaveLength(4);
      expect(filtered).toContain("https://docs.djangoproject.com/en/dev/topics/auth/");
      expect(filtered).toContain("https://docs.djangoproject.com/en/dev/topics/db/models/");
      expect(filtered).toContain("https://docs.djangoproject.com/en/dev/ref/contrib/admin/");
      expect(filtered).toContain("https://docs.djangoproject.com/en/dev/ref/forms/api/fields/");
      expect(filtered).not.toContain("https://docs.djangoproject.com/en/dev/intro/tutorial01/");
      expect(filtered).not.toContain("https://example.com/");
    });

    it("should return empty array when no URLs match", () => {
      const urls = [
        "https://docs.djangoproject.com/en/dev/intro/tutorial01/",
        "https://example.com/",
        "https://docs.djangoproject.com/",
      ];

      const filtered = filterTopicsUrls(urls);

      expect(filtered).toEqual([]);
    });

    it("should handle empty input array", () => {
      const filtered = filterTopicsUrls([]);
      expect(filtered).toEqual([]);
    });

    it("should match all pattern types", () => {
      const urls = [
        "https://docs.djangoproject.com/en/dev/topics/auth/",
        "https://docs.djangoproject.com/en/dev/topics/auth/default/",
        "https://docs.djangoproject.com/en/dev/ref/contrib/admin/",
        "https://docs.djangoproject.com/en/dev/ref/contrib/admin/actions/",
      ];

      const filtered = filterTopicsUrls(urls);

      expect(filtered).toHaveLength(4);
    });

    it("should preserve original order of matching URLs", () => {
      const urls = [
        "https://docs.djangoproject.com/en/dev/ref/contrib/admin/",
        "https://example.com/",
        "https://docs.djangoproject.com/en/dev/topics/auth/",
        "https://docs.djangoproject.com/en/dev/topics/db/models/",
      ];

      const filtered = filterTopicsUrls(urls);

      expect(filtered).toEqual([
        "https://docs.djangoproject.com/en/dev/ref/contrib/admin/",
        "https://docs.djangoproject.com/en/dev/topics/auth/",
        "https://docs.djangoproject.com/en/dev/topics/db/models/",
      ]);
    });

    it("should handle URLs with and without trailing slashes", () => {
      const urls = [
        "https://docs.djangoproject.com/en/dev/topics/auth",
        "https://docs.djangoproject.com/en/dev/topics/db/",
      ];

      const filtered = filterTopicsUrls(urls);

      expect(filtered).toHaveLength(2);
    });
  });

  describe("filterUrlsBySection", () => {
    describe("topics section", () => {
      it("should filter only topics URLs", () => {
        const urls = [
          "https://docs.djangoproject.com/en/dev/topics/auth/",
          "https://docs.djangoproject.com/en/dev/topics/db/",
          "https://docs.djangoproject.com/en/dev/topics/auth/default/",
          "https://docs.djangoproject.com/en/dev/ref/contrib/admin/",
        ];

        const filtered = filterUrlsBySection(urls, "topics");

        expect(filtered).toHaveLength(2);
        expect(filtered).toContain("https://docs.djangoproject.com/en/dev/topics/auth/");
        expect(filtered).toContain("https://docs.djangoproject.com/en/dev/topics/db/");
        expect(filtered).not.toContain("https://docs.djangoproject.com/en/dev/ref/contrib/admin/");
      });
    });

    describe("topicsSub section", () => {
      it("should filter only topicsSub URLs", () => {
        const urls = [
          "https://docs.djangoproject.com/en/dev/topics/auth/",
          "https://docs.djangoproject.com/en/dev/topics/auth/default/",
          "https://docs.djangoproject.com/en/dev/topics/db/models/",
          "https://docs.djangoproject.com/en/dev/ref/contrib/admin/",
        ];

        const filtered = filterUrlsBySection(urls, "topicsSub");

        expect(filtered).toHaveLength(2);
        expect(filtered).toContain("https://docs.djangoproject.com/en/dev/topics/auth/default/");
        expect(filtered).toContain("https://docs.djangoproject.com/en/dev/topics/db/models/");
      });
    });

    describe("ref section", () => {
      it("should filter only ref URLs", () => {
        const urls = [
          "https://docs.djangoproject.com/en/dev/ref/contrib/admin/",
          "https://docs.djangoproject.com/en/dev/ref/forms/api/",
          "https://docs.djangoproject.com/en/dev/ref/contrib/admin/actions/",
          "https://docs.djangoproject.com/en/dev/topics/auth/",
        ];

        const filtered = filterUrlsBySection(urls, "ref");

        expect(filtered).toHaveLength(2);
        expect(filtered).toContain("https://docs.djangoproject.com/en/dev/ref/contrib/admin/");
        expect(filtered).toContain("https://docs.djangoproject.com/en/dev/ref/forms/api/");
      });
    });

    describe("refSub section", () => {
      it("should filter only refSub URLs", () => {
        const urls = [
          "https://docs.djangoproject.com/en/dev/ref/contrib/admin/",
          "https://docs.djangoproject.com/en/dev/ref/contrib/admin/actions/",
          "https://docs.djangoproject.com/en/dev/ref/forms/api/fields/",
          "https://docs.djangoproject.com/en/dev/topics/auth/",
        ];

        const filtered = filterUrlsBySection(urls, "refSub");

        expect(filtered).toHaveLength(2);
        expect(filtered).toContain("https://docs.djangoproject.com/en/dev/ref/contrib/admin/actions/");
        expect(filtered).toContain("https://docs.djangoproject.com/en/dev/ref/forms/api/fields/");
      });
    });

    it("should return empty array when no URLs match section", () => {
      const urls = ["https://docs.djangoproject.com/en/dev/intro/tutorial01/", "https://example.com/"];

      const filtered = filterUrlsBySection(urls, "topics");

      expect(filtered).toEqual([]);
    });

    it("should handle empty input array", () => {
      const filtered = filterUrlsBySection([], "topics");
      expect(filtered).toEqual([]);
    });

    it("should preserve original order", () => {
      const urls = [
        "https://docs.djangoproject.com/en/dev/topics/db/",
        "https://example.com/",
        "https://docs.djangoproject.com/en/dev/topics/auth/",
        "https://docs.djangoproject.com/en/dev/topics/http/",
      ];

      const filtered = filterUrlsBySection(urls, "topics");

      expect(filtered).toEqual([
        "https://docs.djangoproject.com/en/dev/topics/db/",
        "https://docs.djangoproject.com/en/dev/topics/auth/",
        "https://docs.djangoproject.com/en/dev/topics/http/",
      ]);
    });
  });

  describe("getSectionParentUrl", () => {
    describe("ref section URLs", () => {
      it("should return parent URL for two-level deep ref URLs", () => {
        const url = "https://docs.djangoproject.com/en/dev/ref/class-based-views/base/";
        const parent = getSectionParentUrl(url);

        expect(parent).toBe("https://docs.djangoproject.com/en/dev/ref/class-based-views/");
      });

      it("should return parent URL for three-level deep ref URLs", () => {
        const url = "https://docs.djangoproject.com/en/dev/ref/contrib/admin/actions/";
        const parent = getSectionParentUrl(url);

        expect(parent).toBe("https://docs.djangoproject.com/en/dev/ref/contrib/");
      });

      it("should return null for top-level ref URLs", () => {
        const url = "https://docs.djangoproject.com/en/dev/ref/class-based-views/";
        const parent = getSectionParentUrl(url);

        expect(parent).toBeNull();
      });

      it("should handle URLs without trailing slash", () => {
        const url = "https://docs.djangoproject.com/en/dev/ref/class-based-views/base";
        const parent = getSectionParentUrl(url);

        expect(parent).toBe("https://docs.djangoproject.com/en/dev/ref/class-based-views/");
      });
    });

    describe("topics section URLs", () => {
      it("should return parent URL for two-level deep topics URLs", () => {
        const url = "https://docs.djangoproject.com/en/dev/topics/auth/default/";
        const parent = getSectionParentUrl(url);

        expect(parent).toBe("https://docs.djangoproject.com/en/dev/topics/auth/");
      });

      it("should return parent URL for three-level deep topics URLs", () => {
        const url = "https://docs.djangoproject.com/en/dev/topics/db/models/options/";
        const parent = getSectionParentUrl(url);

        expect(parent).toBe("https://docs.djangoproject.com/en/dev/topics/db/");
      });

      it("should return null for top-level topics URLs", () => {
        const url = "https://docs.djangoproject.com/en/dev/topics/auth/";
        const parent = getSectionParentUrl(url);

        expect(parent).toBeNull();
      });
    });

    describe("edge cases", () => {
      it("should return null for URLs without ref or topics", () => {
        const url = "https://docs.djangoproject.com/en/dev/intro/tutorial01/";
        const parent = getSectionParentUrl(url);

        expect(parent).toBeNull();
      });

      it("should return null for base Django docs URL", () => {
        const url = "https://docs.djangoproject.com/";
        const parent = getSectionParentUrl(url);

        expect(parent).toBeNull();
      });

      it("should handle URLs with query parameters", () => {
        const url = "https://docs.djangoproject.com/en/dev/ref/class-based-views/base/?query=test";
        const parent = getSectionParentUrl(url);

        expect(parent).toBe("https://docs.djangoproject.com/en/dev/ref/class-based-views/?query=test");
      });

      it("should handle URLs with hash fragments", () => {
        const url = "https://docs.djangoproject.com/en/dev/ref/class-based-views/base/#section";
        const parent = getSectionParentUrl(url);

        expect(parent).toBe("https://docs.djangoproject.com/en/dev/ref/class-based-views/#section");
      });

      it("should preserve URL protocol and domain", () => {
        const url = "https://docs.djangoproject.com/en/dev/ref/class-based-views/base/";
        const parent = getSectionParentUrl(url);

        expect(parent).toMatch(/^https:\/\/docs\.djangoproject\.com\//);
      });
    });

    describe("deeply nested URLs", () => {
      it("should return immediate parent for deeply nested ref URLs", () => {
        const url = "https://docs.djangoproject.com/en/dev/ref/contrib/admin/actions/extra/";
        const parent = getSectionParentUrl(url);

        expect(parent).toBe("https://docs.djangoproject.com/en/dev/ref/contrib/");
      });

      it("should return immediate parent for deeply nested topics URLs", () => {
        const url = "https://docs.djangoproject.com/en/dev/topics/db/models/options/meta/";
        const parent = getSectionParentUrl(url);

        expect(parent).toBe("https://docs.djangoproject.com/en/dev/topics/db/");
      });
    });

    describe("URL construction", () => {
      it("should always include trailing slash in parent URL", () => {
        const url = "https://docs.djangoproject.com/en/dev/ref/class-based-views/base";
        const parent = getSectionParentUrl(url);

        expect(parent).toMatch(/\/$/);
      });

      it("should construct valid URLs", () => {
        const url = "https://docs.djangoproject.com/en/dev/ref/class-based-views/base/";
        const parent = getSectionParentUrl(url);

        expect(() => new URL(parent!)).not.toThrow();
      });
    });

    describe("section detection", () => {
      it("should find ref section when present", () => {
        const url = "https://docs.djangoproject.com/en/dev/ref/contrib/admin/";
        const parent = getSectionParentUrl(url);

        expect(parent).toBe("https://docs.djangoproject.com/en/dev/ref/contrib/");
      });

      it("should find topics section when present", () => {
        const url = "https://docs.djangoproject.com/en/dev/topics/db/models/";
        const parent = getSectionParentUrl(url);

        expect(parent).toBe("https://docs.djangoproject.com/en/dev/topics/db/");
      });

      it("should prioritize first occurrence of ref or topics", () => {
        const url = "https://docs.djangoproject.com/en/dev/ref/topics/nested/";
        const parent = getSectionParentUrl(url);

        expect(parent).toBe("https://docs.djangoproject.com/en/dev/ref/topics/");
      });
    });
  });
});
