import { DJANGO_DOCS_BASE_URL, SITEMAP_URL, URL_PATTERNS, DJANGO_VERSIONS, DjangoVersion } from "../constants";

describe("constants", () => {
  describe("DJANGO_DOCS_BASE_URL", () => {
    it("should export the correct base URL", () => {
      expect(DJANGO_DOCS_BASE_URL).toBe("https://docs.djangoproject.com");
    });

    it("should be a valid URL", () => {
      expect(() => new URL(DJANGO_DOCS_BASE_URL)).not.toThrow();
    });
  });

  describe("SITEMAP_URL", () => {
    it("should export the correct sitemap URL", () => {
      expect(SITEMAP_URL).toBe("https://docs.djangoproject.com/sitemap-en.xml");
    });

    it("should be a valid URL", () => {
      expect(() => new URL(SITEMAP_URL)).not.toThrow();
    });

    it("should include the base URL", () => {
      expect(SITEMAP_URL).toContain(DJANGO_DOCS_BASE_URL);
    });
  });

  describe("URL_PATTERNS", () => {
    describe("topics pattern", () => {
      it("should match valid topics URLs", () => {
        const validUrls = [
          "https://docs.djangoproject.com/en/dev/topics/auth/",
          "https://docs.djangoproject.com/en/dev/topics/db/",
          "https://docs.djangoproject.com/en/dev/topics/http",
        ];

        validUrls.forEach((url) => {
          expect(URL_PATTERNS.topics.test(url)).toBe(true);
        });
      });

      it("should not match topics sub-level URLs", () => {
        const invalidUrls = [
          "https://docs.djangoproject.com/en/dev/topics/auth/default/",
          "https://docs.djangoproject.com/en/dev/topics/db/models/",
        ];

        invalidUrls.forEach((url) => {
          expect(URL_PATTERNS.topics.test(url)).toBe(false);
        });
      });

      it("should not match non-topics URLs", () => {
        const invalidUrls = [
          "https://docs.djangoproject.com/en/dev/ref/auth/",
          "https://docs.djangoproject.com/en/dev/intro/",
          "https://docs.djangoproject.com/",
        ];

        invalidUrls.forEach((url) => {
          expect(URL_PATTERNS.topics.test(url)).toBe(false);
        });
      });

      it("should not match URLs with trailing segments", () => {
        expect(URL_PATTERNS.topics.test("https://docs.djangoproject.com/en/dev/topics/auth/default/")).toBe(false);
      });
    });

    describe("topicsSub pattern", () => {
      it("should match valid topics sub-level URLs", () => {
        const validUrls = [
          "https://docs.djangoproject.com/en/dev/topics/auth/default/",
          "https://docs.djangoproject.com/en/dev/topics/db/models/",
          "https://docs.djangoproject.com/en/dev/topics/http/urls",
        ];

        validUrls.forEach((url) => {
          expect(URL_PATTERNS.topicsSub.test(url)).toBe(true);
        });
      });

      it("should not match top-level topics URLs", () => {
        const invalidUrls = [
          "https://docs.djangoproject.com/en/dev/topics/auth/",
          "https://docs.djangoproject.com/en/dev/topics/db/",
        ];

        invalidUrls.forEach((url) => {
          expect(URL_PATTERNS.topicsSub.test(url)).toBe(false);
        });
      });

      it("should not match deeper nesting levels", () => {
        const invalidUrl = "https://docs.djangoproject.com/en/dev/topics/auth/default/extra/";
        expect(URL_PATTERNS.topicsSub.test(invalidUrl)).toBe(false);
      });
    });

    describe("ref pattern", () => {
      it("should match valid ref URLs", () => {
        const validUrls = [
          "https://docs.djangoproject.com/en/dev/ref/contrib/admin/",
          "https://docs.djangoproject.com/en/dev/ref/forms/api/",
          "https://docs.djangoproject.com/en/dev/ref/models/fields",
        ];

        validUrls.forEach((url) => {
          expect(URL_PATTERNS.ref.test(url)).toBe(true);
        });
      });

      it("should not match ref sub-level URLs", () => {
        const invalidUrls = [
          "https://docs.djangoproject.com/en/dev/ref/contrib/admin/actions/",
          "https://docs.djangoproject.com/en/dev/ref/forms/api/forms/",
        ];

        invalidUrls.forEach((url) => {
          expect(URL_PATTERNS.ref.test(url)).toBe(false);
        });
      });

      it("should not match single-level ref URLs", () => {
        const invalidUrl = "https://docs.djangoproject.com/en/dev/ref/models/";
        expect(URL_PATTERNS.ref.test(invalidUrl)).toBe(false);
      });

      it("should not match non-ref URLs", () => {
        const invalidUrls = [
          "https://docs.djangoproject.com/en/dev/topics/auth/",
          "https://docs.djangoproject.com/en/dev/intro/",
        ];

        invalidUrls.forEach((url) => {
          expect(URL_PATTERNS.ref.test(url)).toBe(false);
        });
      });
    });

    describe("refSub pattern", () => {
      it("should match valid ref sub-level URLs", () => {
        const validUrls = [
          "https://docs.djangoproject.com/en/dev/ref/contrib/admin/actions/",
          "https://docs.djangoproject.com/en/dev/ref/forms/api/forms/",
          "https://docs.djangoproject.com/en/dev/ref/models/fields/extra",
        ];

        validUrls.forEach((url) => {
          expect(URL_PATTERNS.refSub.test(url)).toBe(true);
        });
      });

      it("should not match two-level ref URLs", () => {
        const invalidUrls = [
          "https://docs.djangoproject.com/en/dev/ref/contrib/admin/",
          "https://docs.djangoproject.com/en/dev/ref/forms/api/",
        ];

        invalidUrls.forEach((url) => {
          expect(URL_PATTERNS.refSub.test(url)).toBe(false);
        });
      });

      it("should not match deeper nesting levels", () => {
        const invalidUrl = "https://docs.djangoproject.com/en/dev/ref/contrib/admin/actions/extra/more/";
        expect(URL_PATTERNS.refSub.test(invalidUrl)).toBe(false);
      });
    });

    describe("pattern properties", () => {
      it("should contain all expected pattern keys", () => {
        expect(Object.keys(URL_PATTERNS)).toEqual(["topics", "topicsSub", "ref", "refSub"]);
      });

      it("should have all patterns as RegExp instances", () => {
        Object.values(URL_PATTERNS).forEach((pattern) => {
          expect(pattern).toBeInstanceOf(RegExp);
        });
      });
    });

    describe("trailing slash handling", () => {
      it("should match URLs with or without trailing slashes", () => {
        expect(URL_PATTERNS.topics.test("https://docs.djangoproject.com/en/dev/topics/auth/")).toBe(true);
        expect(URL_PATTERNS.topics.test("https://docs.djangoproject.com/en/dev/topics/auth")).toBe(true);

        expect(URL_PATTERNS.ref.test("https://docs.djangoproject.com/en/dev/ref/contrib/admin/")).toBe(true);
        expect(URL_PATTERNS.ref.test("https://docs.djangoproject.com/en/dev/ref/contrib/admin")).toBe(true);
      });
    });
  });

  describe("DJANGO_VERSIONS", () => {
    it("should export an array of version strings", () => {
      expect(Array.isArray(DJANGO_VERSIONS)).toBe(true);
      expect(DJANGO_VERSIONS.length).toBeGreaterThan(0);
    });

    it("should contain expected version strings", () => {
      expect(DJANGO_VERSIONS).toEqual(["6.0", "dev", "5.1", "5.0", "4.2"]);
    });

    it("should include dev version", () => {
      expect(DJANGO_VERSIONS).toContain("dev");
    });

    it("has readonly type at compile time", () => {
      const versions = DJANGO_VERSIONS;
      expect(Object.isFrozen(versions)).toBe(false);

      const typedVersion: DjangoVersion = "6.0";
      expect(DJANGO_VERSIONS).toContain(typedVersion);
    });

    it("should have all version strings in correct format", () => {
      DJANGO_VERSIONS.forEach((version) => {
        expect(typeof version).toBe("string");
        expect(version.length).toBeGreaterThan(0);
      });
    });
  });

  describe("DjangoVersion type", () => {
    it("should accept valid Django version strings", () => {
      const version1: DjangoVersion = "6.0";
      const version2: DjangoVersion = "dev";
      const version3: DjangoVersion = "5.1";
      const version4: DjangoVersion = "5.0";
      const version5: DjangoVersion = "4.2";

      expect([version1, version2, version3, version4, version5]).toEqual(["6.0", "dev", "5.1", "5.0", "4.2"]);
    });
  });
});
