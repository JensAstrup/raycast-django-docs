import axios from "axios";
import * as cheerio from "cheerio";
import { SITEMAP_URL } from "../constants";

export async function fetchSitemap(sitemapUrl: string = SITEMAP_URL): Promise<string[]> {
  const response = await axios.get(sitemapUrl);
  const $ = cheerio.load(response.data, { xmlMode: true });
  const urls: string[] = [];

  $("url loc").each((_, element) => {
    urls.push($(element).text());
  });

  return urls;
}
