export function isShowcaseMode(): boolean {
  return process.env.SHOWCASE_MODE === "true";
}

export function isClientShowcaseMode(): boolean {
  return process.env.NEXT_PUBLIC_SHOWCASE_MODE === "true";
}
