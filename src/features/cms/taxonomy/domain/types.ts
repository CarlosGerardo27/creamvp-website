export type CmsCategoryRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  updated_at: string;
};

export type CmsTagRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  updated_at: string;
};

export type CmsAuthorRow = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  photo_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  x_url: string | null;
  tiktok_url: string | null;
  linkedin_url: string | null;
  personal_url: string | null;
  is_active: boolean;
  updated_at: string;
};
