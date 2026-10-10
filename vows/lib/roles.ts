export const roles = ["bruid", "bruidegom", "ceremoniemeester"] as const;
export type UserRole = (typeof roles)[number];
