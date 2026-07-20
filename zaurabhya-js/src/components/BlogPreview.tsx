import Image from "next/image";
import Link from "next/link";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import { BLOG_POSTS } from "@/data/blog";

export default function BlogPreview() {
  if (BLOG_POSTS.length === 0) return null;

  const posts = [...BLOG_POSTS]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 3);

  return (
    <section id="blog" className="px-4 py-11 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2.5 text-xs font-bold tracking-[0.2em] text-coral">
              FROM THE BLOG
            </p>
            <h2 className="font-heading text-3xl font-bold text-ink sm:text-4xl">
              Stories from our farms
            </h2>
          </div>
          <Link
            href="/blog"
            className="text-sm font-bold text-ink-soft transition hover:text-coral"
          >
            View all articles &rarr;
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white"
            >
              <Link href={`/blog/${post.slug}`}>
                {post.coverImage ? (
                  <div className="relative h-44 bg-white">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <PhotoPlaceholder caption={post.title} className="h-44" />
                )}
              </Link>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-semibold text-ink-muted">
                  {new Date(post.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <Link href={`/blog/${post.slug}`}>
                  <h3 className="mt-1 font-heading text-xl font-bold text-ink">
                    {post.title}
                  </h3>
                </Link>
                <p className="mt-2 flex-1 text-sm text-ink-muted">
                  {post.excerpt}
                </p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-4 text-sm font-bold text-ink-soft transition hover:text-coral"
                >
                  Read more &rarr;
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
