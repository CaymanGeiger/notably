import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "radial-gradient(circle at 28% 22%, rgba(235, 129, 83, 0.34), transparent 52%), linear-gradient(160deg, #f7f1e7 0%, #efe7da 100%)",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "linear-gradient(180deg, #22252d 0%, #16181f 100%)",
            borderRadius: 46,
            color: "#ffffff",
            display: "flex",
            fontSize: 94,
            fontWeight: 800,
            height: 122,
            justifyContent: "center",
            width: 122,
          }}
        >
          N
        </div>
      </div>
    ),
    size,
  );
}
