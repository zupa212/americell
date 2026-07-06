// Blog data layer for the Americell marketing site.
//
// Posts are authored as typed TypeScript modules under `content/blog/<slug>.ts`,
// each exporting a `post: BlogPost`. This module is the single source of truth
// the routes consume: it re-exports the aggregated, date-sorted collection plus
// small lookup helpers. Keeping content in typed modules (rather than raw MDX)
// means every post is type-checked against `BlogPost` at build time.

import { post as tiEinaiOTilecheirismosTilefonou } from "@/content/blog/ti-einai-o-tilecheirismos-tilefonou";
import { post as pragmatikaIphoneAndroidIpaApoBrowser } from "@/content/blog/pragmatika-iphone-android-ipa-apo-browser";
import { post as remotePhoneAppTestingQa } from "@/content/blog/remote-phone-app-testing-qa";
import { post as diaxeirisiLogariasmonPragmatikesSyskeuesIpa } from "@/content/blog/diaxeirisi-logariasmon-pragmatikes-syskeues-ipa";
import { post as usPhoneRentalGrowthTeamsPraktoreia } from "@/content/blog/us-phone-rental-growth-teams-praktoreia";
import { post as cloudIphonePlirisOdigos } from "@/content/blog/cloud-iphone-pliris-odigos";

/**
 * The shared shape every blog post module conforms to. Authored content lives
 * in `content/blog/<slug>.ts` as `export const post: BlogPost = { ... }`.
 */
export type BlogPost = {
  /** URL-safe slug; also the content module filename. */
  slug: string;
  /** Post title (h1 + <title>). */
  title: string;
  /** Meta description / card summary (~150 chars). */
  description: string;
  /** SEO keywords surfaced in metadata. */
  keywords: string[];
  /** Publish date, ISO `YYYY-MM-DD`. */
  date: string;
  /** Byline. */
  author: string;
  /** Estimated reading time in minutes. */
  readingMinutes: number;
  /** Post body as GitHub-flavored Markdown. */
  body: string;
};

/**
 * Every post, newest first. Sorted once at module load by ISO `date` desc.
 * The comparison is a plain string compare, valid for `YYYY-MM-DD` ISO dates.
 */
export const POSTS: BlogPost[] = [
  tiEinaiOTilecheirismosTilefonou,
  pragmatikaIphoneAndroidIpaApoBrowser,
  remotePhoneAppTestingQa,
  diaxeirisiLogariasmonPragmatikesSyskeuesIpa,
  usPhoneRentalGrowthTeamsPraktoreia,
  cloudIphonePlirisOdigos,
].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

/** All posts, newest first. */
export function getAllPosts(): BlogPost[] {
  return POSTS;
}

/** Look up a single post by slug, or `undefined` when none matches. */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find((post) => post.slug === slug);
}
