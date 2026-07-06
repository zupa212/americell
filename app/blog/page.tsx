import Reveal from "@/components/ui/reveal";
import PostCard from "@/components/blog/post-card";
import { getAllPosts } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Blog",
  description:
    "Field notes on renting and remote-controlling real US phones (iPhone & Android) from your browser — app testing & QA, localization, managing your own accounts and flows, growth teams & agencies.",
  alternates: { canonical: "/blog" },
});

/**
 * Blog index — a strictly black-and-white editorial masthead (Apple Newsroom /
 * premium magazine register), deliberately distinct from the colorful
 * glassmorphism marketing site. An opaque near-white surface covers the global
 * aurora; typography and generous whitespace do the work. The surrounding chrome
 * (nav / footer) is provided by `app/blog/layout.tsx`.
 */
export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-24 lg:py-28">
        {/* Masthead */}
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
            <span className="font-bold text-neutral-900">Americell</span>
            <span aria-hidden="true" className="mx-2 text-neutral-300">
              /
            </span>
            The Blog
          </p>

          <h1 className="mt-5 text-5xl font-black leading-[0.95] tracking-tight text-neutral-900 sm:text-7xl">
            Field notes
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-600 sm:text-xl">
            Practical guides to renting and remote-controlling real US iPhones
            and Android devices from your browser — app testing and QA, localized
            verification, managing your own accounts and flows, and playbooks for
            growth teams and agencies.
          </p>
        </Reveal>

        {/* Section label + count over a black hairline rule */}
        <div className="mt-14 flex items-baseline justify-between border-t border-neutral-200 pt-8 sm:mt-20">
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-neutral-500">
            Latest
          </h2>
          <span className="text-sm tabular-nums text-neutral-500">
            {posts.length} {posts.length === 1 ? "article" : "articles"}
          </span>
        </div>

        {/* Monochrome grid of post cards */}
        <div
          className={cn(
            "mt-8 grid grid-cols-1 gap-6 sm:mt-10",
            posts.length > 1 && "sm:grid-cols-2",
          )}
        >
          {posts.map((post, i) => (
            <Reveal
              key={post.slug}
              as="div"
              delay={Math.min(i * 0.05, 0.3)}
              className="h-full"
            >
              <PostCard post={post} />
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
