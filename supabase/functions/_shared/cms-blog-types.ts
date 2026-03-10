// @ts-nocheck
export const CMS_USER_ROLES = ["admin", "editor", "reviewer", "developer"] as const;
export type CmsUserRole = (typeof CMS_USER_ROLES)[number];

export const BLOG_POST_STATUSES = ["draft", "scheduled", "published"] as const;
export type BlogPostStatus = (typeof BLOG_POST_STATUSES)[number];

export type CmsProfile = {
  id: string;
  role: CmsUserRole;
  is_active: boolean;
};

export type FeaturedImagePayload = {
  url: string;
  alt: string;
  metadata?: Record<string, unknown>;
};

export type BlogFaqPayload = {
  question: string;
  answer: string;
  position?: number;
};

