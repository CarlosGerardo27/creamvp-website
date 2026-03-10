export type CmsBlogStatus = "draft" | "scheduled" | "published";

export type CmsOption = {
  id: string;
  name: string;
  slug: string;
};

export type CmsBlogListFilters = {
  search?: string;
  status?: CmsBlogStatus | "all";
};

export type CmsBlogListItem = {
  id: string;
  status: CmsBlogStatus;
  slug: string;
  category_slug: string;
  h1: string | null;
  meta_description: string | null;
  publish_date: string | null;
  updated_at: string;
};

export type CmsBlogFaqItem = {
  question: string;
  answer: string;
  position?: number;
};

export type CmsBlogPostDetails = {
  id: string;
  status: CmsBlogStatus;
  slug: string;
  category_id: string;
  category_slug: string;
  h1: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  short_description: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  featured_image_metadata: Record<string, unknown> | null;
  author_id: string | null;
  content_markdown: string | null;
  schema_auto: Record<string, unknown> | null;
  schema_override: Record<string, unknown> | null;
  seo: Record<string, unknown> | null;
  publish_date: string | null;
  scheduled_publish_at: string | null;
  updated_at: string;
  tags: string[];
  faqs: CmsBlogFaqItem[];
};

export type CmsCreateBlogInput = {
  slug: string;
  categoryId: string;
  h1?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  shortDescription?: string | null;
  featuredImage?: {
    url: string;
    alt: string;
    metadata?: Record<string, unknown>;
  } | null;
  authorId?: string | null;
  contentMarkdown?: string | null;
  schemaOverride?: Record<string, unknown> | null;
  seo?: Record<string, unknown> | null;
  tags?: string[];
  faqs?: CmsBlogFaqItem[];
};

export type CmsUpdateBlogInput = {
  postId: string;
  patch: {
    slug?: string;
    categoryId?: string;
    h1?: string | null;
    metaDescription?: string | null;
    canonicalUrl?: string | null;
    shortDescription?: string | null;
    featuredImage?: {
      url: string;
      alt: string;
      metadata?: Record<string, unknown>;
    } | null;
    authorId?: string | null;
    contentMarkdown?: string | null;
    schemaOverride?: Record<string, unknown> | null;
    seo?: Record<string, unknown> | null;
  };
  tags?: string[];
  faqs?: CmsBlogFaqItem[];
};

export type CmsUpdateBlogStatusInput = {
  postId: string;
  status: CmsBlogStatus;
  scheduledPublishAt?: string | null;
  changeReason?: string | null;
};
