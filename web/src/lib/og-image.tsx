import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

function titleSize(title: string) {
  if (title.length > 52) return 52;
  if (title.length > 36) return 64;
  return 76;
}

async function fonts() {
  const dir = join(process.cwd(), "src/fonts");
  const [regular, bold] = await Promise.all([
    readFile(join(dir, "Inter-latin-400.woff")),
    readFile(join(dir, "Inter-latin-700.woff")),
  ]);
  return [
    { name: "Inter", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: bold, weight: 700 as const, style: "normal" as const },
  ];
}

export async function ogImage(title: string) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#1c1c1c",
        color: "#ffffff",
        fontFamily: "Inter",
      }}
    >
      <div style={{ width: 28, height: "100%", background: "#00704a" }} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 1172,
          padding: "64px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              background: "#00704a",
              color: "#ffffff",
              fontSize: 40,
              fontWeight: 700,
            }}
          >
            c
          </div>
          <div
            style={{
              marginLeft: 20,
              color: "#5fd3a3",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            cercadelestadio
          </div>
        </div>
        <div
          style={{
            display: "flex",
            width: 980,
            fontSize: titleSize(title),
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: -1.5,
          }}
        >
          {title}
        </div>
        <div style={{ width: 120, height: 8, background: "#00704a" }} />
      </div>
    </div>,
    { ...ogSize, fonts: await fonts() },
  );
}
