import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/ui/reveal";
import Article from "@/components/blog/article";
import { POSTS, getPostBySlug } from "@/lib/blog";
import {
  OG_IMAGE_PATH,
  SITE_NAME,
  SITE_URL,
  buildMetadata,
} from "@/lib/seo";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ slug: string }> };

/** Statically prerender one page per known post at build time. */
export function generateStaticParams(): { slug: string }[] {
  return POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return buildMetadata({ title: "Article", robots: { index: false, follow: false } });
  }

  const canonical = `${SITE_URL}/blog/${post.slug}`;

  return buildMetadata({
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      authors: [post.author],
    },
  });
}

/** BlogPosting JSON-LD for rich results. Author is modeled as an
 *  Organization for the in-house team byline, otherwise a Person. */
function blogPostingJsonLd(post: NonNullable<ReturnType<typeof getPostBySlug>>) {
  const canonical = `${SITE_URL}/blog/${post.slug}`;
  const image = `${SITE_URL}${OG_IMAGE_PATH}`;
  const isTeamByline = /ομάδα|team|americell/i.test(post.author);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: "el-GR",
    keywords: post.keywords.join(", "),
    author: {
      "@type": isTeamByline ? "Organization" : "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: image },
    },
    image: [image],
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    url: canonical,
  };
}

/**
 * Format an ISO `YYYY-MM-DD` date as a long US English date. The `T00:00:00`
 * anchor keeps the day stable regardless of the build machine's timezone.
 */
function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const focusRing =
  "rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const jsonLd = JSON.stringify(blogPostingJsonLd(post));

  return (
    // Opaque near-white canvas that fully covers the global aurora background.
    // Deliberately monochrome, typography-first — the editorial counterpoint to
    // the colorful glassmorphism marketing site.
    <main className="relative min-h-screen bg-neutral-50 text-neutral-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        {/* Editorial header: breadcrumb, title, meta */}
        <Reveal>
          <header>
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                <li>
                  <Link
                    href="/"
                    className={cn(
                      "transition-colors hover:text-neutral-900",
                      focusRing,
                    )}
                  >
                    Home
                  </Link>
                </li>
                <li aria-hidden="true" className="text-neutral-300">
                  /
                </li>
                <li>
                  <Link
                    href="/blog"
                    className={cn(
                      "transition-colors hover:text-neutral-900",
                      focusRing,
                    )}
                  >
                    Blog
                  </Link>
                </li>
              </ol>
            </nav>

            <h1 className="mt-8 text-3xl font-bold leading-[1.12] tracking-tight text-neutral-900 [overflow-wrap:anywhere] sm:text-5xl sm:leading-[1.08]">
              {post.title}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500">
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span aria-hidden="true" className="text-neutral-300">
                ·
              </span>
              <span>{post.readingMinutes} min read</span>
            </div>
          </header>
        </Reveal>

        {/* Article body */}
        <Reveal delay={0.05}>
          <div className="mt-12">
            <Article post={post} />
          </div>
        </Reveal>

        {/* Thin divider + B&W text CTA */}
        <Reveal delay={0.1}>
          <div className="mt-16 border-t border-neutral-200 pt-10">
            <p className="text-base text-neutral-500">
              Rent a real, remote-controlled US iPhone or Android — operated
              straight from your browser for app testing, QA, localization and
              growth work.
            </p>
            <Link
              href="/signup"
              className={cn(
                "group mt-5 inline-flex items-center gap-2 text-base font-semibold text-neutral-900",
                "underline decoration-neutral-300 decoration-2 underline-offset-4",
                "transition-colors hover:decoration-neutral-900",
                focusRing,
              )}
            >
              Get started
              <span
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
