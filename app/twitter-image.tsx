import { ImageResponse } from "next/og";
import { OgCard, OG_ALT, OG_WIDTH, OG_HEIGHT } from "@/lib/og";

export const alt = OG_ALT;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image(): Promise<ImageResponse> {
  return new ImageResponse(<OgCard />, { width: OG_WIDTH, height: OG_HEIGHT });
}
