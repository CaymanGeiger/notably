import Link from "next/link";

type AccountAvatarLinkProps = {
  label: string;
  secondaryLabel?: string;
  href?: string;
  variant?: "row" | "chip";
  className?: string;
};

function resolveInitials(label: string): string {
  const trimmedLabel = label.trim();

  if (!trimmedLabel) {
    return "A";
  }

  const emailLocalPart = trimmedLabel.includes("@")
    ? trimmedLabel.split("@")[0]
    : trimmedLabel;

  const segments = emailLocalPart
    .split(/[\s._-]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return trimmedLabel.slice(0, 1).toUpperCase();
  }

  if (segments.length === 1) {
    return segments[0].slice(0, 1).toUpperCase();
  }

  return segments
    .slice(0, 2)
    .map((segment) => segment.slice(0, 1).toUpperCase())
    .join("");
}

export function AccountAvatarLink({
  label,
  secondaryLabel,
  href = "/account",
  variant = "row",
  className,
}: AccountAvatarLinkProps) {
  const classes = ["account-link", `account-link-${variant}`];

  if (className) {
    classes.push(className);
  }

  return (
    <Link href={href} className={classes.join(" ")}>
      <span className="account-link-avatar" aria-hidden="true">
        {resolveInitials(label)}
      </span>
      <span className="account-link-copy">
        <strong>{label}</strong>
        {secondaryLabel ? <span>{secondaryLabel}</span> : null}
      </span>
    </Link>
  );
}
