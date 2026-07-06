import PageShell from "@/components/page-shell";
import Reveal from "@/components/ui/reveal";
import PostCard from "@/components/blog/post-card";
import { getAllPosts } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Blog",
  description:
    "Οδηγοί & άρθρα για τηλεχειρισμό πραγματικών τηλεφώνων ΗΠΑ (iPhone & Android) από τον browser — app testing, QA, διαχείριση λογαριασμών, growth teams & πρακτορεία.",
  alternates: { canonical: "/blog" },
});

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wide text-brand">
            Blog
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Οδηγοί &amp; άρθρα για{" "}
            <span className="bg-gradient-to-r from-brand via-brand-2 to-brand-soft bg-clip-text text-transparent">
              τηλεχειρισμό πραγματικών τηλεφώνων ΗΠΑ
            </span>
          </h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Πρακτικοί οδηγοί για τον τηλεχειρισμό αληθινών iPhone και Android των
            ΗΠΑ μέσα από τον browser — δοκιμές &amp; QA εφαρμογών, τοπικοποιημένος
            έλεγχος, διαχείριση των δικών σου λογαριασμών και ροών, growth teams
            και πρακτορεία.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal
              key={post.slug}
              delay={Math.min(i * 0.05, 0.3)}
              as="div"
              className="h-full"
            >
              <PostCard post={post} />
            </Reveal>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
