export type PublicBlogTag = {
  name: string;
  slug: string;
};

export type PublicBlogFaq = {
  question: string;
  answer: string;
  position: number;
};

export type PublicBlogAuthorSocialLinks = {
  facebookUrl: string | null;
  instagramUrl: string | null;
  xUrl: string | null;
  tiktokUrl: string | null;
  linkedinUrl: string | null;
  personalUrl: string | null;
};

export type PublicBlogAuthor = {
  name: string;
  bio: string | null;
  photoUrl: string | null;
  socialLinks: PublicBlogAuthorSocialLinks;
};

export type PublicBlogPost = {
  source: "cms" | "markdown";
  slug: string;
  categorySlug: string;
  categoryName: string;
  title: string;
  snippet: string;
  authorName: string;
  author: PublicBlogAuthor;
  publishDate: Date;
  updatedAt: Date | null;
  imageSrc: string;
  imageAlt: string;
  contentMarkdown: string;
  canonicalUrl: string;
  tags: PublicBlogTag[];
  faqs: PublicBlogFaq[];
};

export type PublicBlogCategory = {
  slug: string;
  name: string;
  postsCount: number;
};
