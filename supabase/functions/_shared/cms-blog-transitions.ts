// @ts-nocheck
import type { BlogPostStatus, CmsUserRole } from "./cms-blog-types.ts";

type TransitionRule = {
  from: BlogPostStatus;
  to: BlogPostStatus;
  roles: CmsUserRole[];
};

const STATUS_TRANSITION_RULES: TransitionRule[] = [
  { from: "draft", to: "published", roles: ["admin", "reviewer"] },
  { from: "published", to: "draft", roles: ["admin", "reviewer"] },
  { from: "draft", to: "scheduled", roles: ["admin", "editor"] },
  { from: "scheduled", to: "published", roles: ["admin", "reviewer"] },
];

export function isAllowedStatusTransition(from: BlogPostStatus, to: BlogPostStatus): boolean {
  return STATUS_TRANSITION_RULES.some((rule) => rule.from === from && rule.to === to);
}

export function isRoleAllowedForStatusTransition(
  role: CmsUserRole,
  from: BlogPostStatus,
  to: BlogPostStatus,
): boolean {
  return STATUS_TRANSITION_RULES.some((rule) => rule.from === from && rule.to === to && rule.roles.includes(role));
}

export function listAllowedTransitions(): TransitionRule[] {
  return [...STATUS_TRANSITION_RULES];
}

