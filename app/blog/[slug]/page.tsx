import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import PageShell from "@/components/page-shell";
import Reveal from "@/components/ui/reveal";
import Article from "@/components/blog/article";
import { POSTS, getPostBySlug } from "@/lib/blog";
import {
  OG_IMAGE_PATH,
  SITE_NAME,
  SITE_URL,
  buildMetadata,
} from "@/lib/seo";

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

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const jsonLd = JSON.stringify(blogPostingJsonLd(post));

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <div className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
        {/* Breadcrumb */}
        <Reveal>
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/"
                  className="rounded-sm transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  Home
                </Link>
              </li>
              <ChevronRight
                aria-hidden="true"
                className="h-4 w-4 flex-none text-line"
              />
              <li>
                <Link
                  href="/blog"
                  className="rounded-sm transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  Blog
                </Link>
              </li>
              <ChevronRight
                aria-hidden="true"
                className="h-4 w-4 flex-none text-line"
              />
              <li aria-current="page" className="min-w-0 truncate text-foreground">
                {post.title}
              </li>
            </ol>
          </nav>
        </Reveal>

        <Reveal delay={0.05}>
          <Article post={post} />
        </Reveal>

        {/* Back to index */}
        <Reveal delay={0.1}>
          <div className="mt-10 flex justify-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/60 px-5 py-2.5 text-sm font-medium text-foreground backdrop-blur-xl ring-1 ring-white/40 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              ← All articles
            </Link>
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
