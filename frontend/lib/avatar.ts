const PALETTE = [
  "#5b54d6", "#e05c43", "#2f7d4d", "#b46a2a",
  "#2f6b9e", "#8b5cf6", "#d04f63", "#0891b2",
  "#6d4c9e", "#b45309", "#047857", "#be185d",
];

export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

/** True only for real uploaded/OAuth photos — not ui-avatars.com placeholders */
export function isRealAvatar(url?: string | null): boolean {
  if (!url) return false;
  return !url.includes("ui-avatars.com");
}
