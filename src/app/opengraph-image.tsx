import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/site";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background:
            "radial-gradient(circle at 14% 18%, rgba(235, 129, 83, 0.16), transparent 34%), radial-gradient(circle at 80% 22%, rgba(235, 129, 83, 0.18), transparent 30%), linear-gradient(180deg, #fbf7f0 0%, #f3ecdf 100%)",
          color: "#1c1f26",
          display: "flex",
          height: "100%",
          padding: "56px",
          width: "100%",
        }}
      >
        <div
          style={{
            background:
              "radial-gradient(circle at 75% 16%, rgba(235, 129, 83, 0.12), transparent 36%), linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(249,244,236,0.98) 100%)",
            border: "1px solid rgba(205, 180, 142, 0.52)",
            borderRadius: "32px",
            boxShadow: "0 28px 80px rgba(84, 56, 24, 0.12)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "space-between",
            padding: "58px 60px",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <div style={{ display: "flex", fontFamily: "Georgia, serif", fontSize: 72, fontWeight: 700 }}>
              <span style={{ color: "#171922" }}>Not</span>
              <span style={{ color: "#d26f40" }}>ably</span>
            </div>
            <div
              style={{
                color: "#5d5446",
                display: "flex",
                fontSize: 28,
                letterSpacing: "-0.02em",
                maxWidth: "820px",
              }}
            >
              {siteConfig.description}
            </div>
          </div>

          <div
            style={{
              alignItems: "stretch",
              display: "flex",
              gap: "22px",
              width: "100%",
            }}
          >
            <div
              style={{
                background: "linear-gradient(180deg, #232630 0%, #171921 100%)",
                border: "1px solid rgba(47, 51, 63, 0.7)",
                borderRadius: "26px",
                color: "#f8f5ef",
                display: "flex",
                flex: "1 1 0",
                flexDirection: "column",
                padding: "28px",
              }}
            >
              <div style={{ color: "#a4a9b8", display: "flex", fontSize: 18, fontWeight: 600 }}>
                NOTES BUILT FOR TEAMS
              </div>
              <div
                style={{
                  display: "flex",
                  fontFamily: "Georgia, serif",
                  fontSize: 54,
                  fontWeight: 700,
                  lineHeight: 1.03,
                  marginTop: "18px",
                  maxWidth: "470px",
                }}
              >
                Keep your team aligned with shared notes everyone can trust.
              </div>
            </div>

            <div
              style={{
                borderLeft: "1px solid rgba(205, 180, 142, 0.42)",
                color: "#2d302f",
                display: "flex",
                flex: "0 0 350px",
                flexDirection: "column",
                gap: "20px",
                paddingLeft: "26px",
              }}
            >
              <div style={{ color: "#5d5446", display: "flex", fontSize: 18, fontWeight: 700 }}>
                CONTROLLED COLLABORATION
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", fontSize: 28, fontWeight: 700 }}>Reusable templates</div>
                <div style={{ display: "flex", fontSize: 28, fontWeight: 700 }}>Note-level permissions</div>
                <div style={{ display: "flex", fontSize: 28, fontWeight: 700 }}>Realtime discussion</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
