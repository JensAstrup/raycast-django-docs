export const DJANGO_DOCS_BASE_URL = "https://docs.djangoproject.com";
export const SITEMAP_URL = "https://docs.djangoproject.com/sitemap-en.xml";

export const URL_PATTERNS = {
  topics: /^https:\/\/docs\.djangoproject\.com\/en\/dev\/topics\/[^/]+\/?$/, // e.g. https://docs.djangoproject.com/en/dev/topics/http/requests/
  topicsSub: /^https:\/\/docs\.djangoproject\.com\/en\/dev\/topics\/[^/]+\/[^/]+\/?$/, // e.g. https://docs.djangoproject.com/en/dev/topics/http/requests/sub/
  ref: /^https:\/\/docs\.djangoproject\.com\/en\/dev\/ref\/[^/]+\/[^/]+\/?$/, // e.g. https://docs.djangoproject.com/en/dev/ref/contrib/auth/
  refSub: /^https:\/\/docs\.djangoproject\.com\/en\/dev\/ref\/[^/]+\/[^/]+\/[^/]+\/?$/, // e.g. https://docs.djangoproject.com/en/dev/ref/contrib/auth/sub/
};

export const DJANGO_VERSIONS = ["6.0", "dev", "5.1", "5.0", "4.2"] as const;
export type DjangoVersion = (typeof DJANGO_VERSIONS)[number];
