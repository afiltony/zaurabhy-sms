import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import { BLOG_POSTS } from "@/data/blog";
import { withSiteKeywords } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Blog",
  description: "Stories from our farms, recipes, and rice know-how.",
  keywords: withSiteKeywords("Kerala rice farming blog", "Kerala rice recipes"),
};

export default function BlogPage() {
  return (
    <div className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-9 text-center">
          <p className="mb-2.5 text-xs font-bold tracking-[0.2em] text-coral">
            BLOG
          </p>
          <h1 className="font-heading text-3xl font-bold text-ink sm:text-4xl">
            Stories from our farms
          </h1>
        </div>

        {BLOG_POSTS.length === 0 ? (
          <p className="text-center text-sm text-ink-muted">
            New articles are on the way — check back soon.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BLOG_POSTS.map((post) => (
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
                    <h2 className="mt-1 font-heading text-xl font-bold text-ink">
                      {post.title}
                    </h2>
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
        )}
      </div>
    </div>
  );
}
