import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import { BLOG_POSTS, getPostBySlug } from "@/data/blog";
import { withSiteKeywords } from "@/lib/seo";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(
  props: PageProps<"/blog/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    keywords: withSiteKeywords("Kerala rice farming blog"),
  };
}

export default async function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/blog"
          className="text-sm font-semibold text-ink-muted transition hover:text-coral"
        >
          &larr; Back to blog
        </Link>

        <div className="mt-5">
          <div className="overflow-hidden rounded-2xl border border-border bg-white">
            {post.coverImage ? (
              <div className="relative h-72 sm:h-96">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  sizes="(min-width: 640px) 640px, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <PhotoPlaceholder caption={post.title} className="h-72 sm:h-96" />
            )}
          </div>

          <p className="mt-6 text-xs font-semibold text-ink-muted">
            {new Date(post.date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold text-ink sm:text-4xl">
            {post.title}
          </h1>

          <div className="mt-5 space-y-4 text-base leading-relaxed text-ink-muted">
            {post.content.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
