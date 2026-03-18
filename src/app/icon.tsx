import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "radial-gradient(circle at 30% 24%, rgba(235, 129, 83, 0.32), transparent 54%), linear-gradient(160deg, #f7f1e7 0%, #efe7da 100%)",
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
            border: "14px solid rgba(26, 28, 35, 0.12)",
            borderRadius: 132,
            color: "#ffffff",
            display: "flex",
            fontSize: 238,
            fontWeight: 800,
            height: 336,
            justifyContent: "center",
            width: 336,
          }}
        >
          N
        </div>
      </div>
    ),
    size,
  );
}
