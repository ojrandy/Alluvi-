import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

/**
 * Default share card for every page without its own image (products set theirs in
 * generateMetadata). Brand surface + white wordmark + tagline (SEO audit D01, M1).
 */
export const alt = `${site.name}: ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public/images/Alluvi-logo-2-white.png"), "base64");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 50% 38%, rgba(255,130,0,0.22), #060708 62%)",
          backgroundColor: "#060708",
          color: "#ffffff",
        }}
      >
        {/* 1326 × 722 source. Rendered by Satori into a PNG, so next/image does not apply. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/png;base64,${logo}`} width={442} height={241} alt="" />
        <div style={{ marginTop: 40, fontSize: 40, fontWeight: 600, letterSpacing: -0.5 }}>{site.tagline}</div>
        <div style={{ marginTop: 18, fontSize: 22, color: "#a1a1aa", letterSpacing: 2, textTransform: "uppercase" }}>
          For laboratory research use only · Not for human consumption
        </div>
      </div>
    ),
    { ...size },
  );
}
