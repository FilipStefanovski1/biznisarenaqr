import Image from "next/image";
import type { Contestant } from "@/config/contestants";

/**
 * A contestant's brand logo on a tile in the logo's own background colour, so logos made
 * for white or dark grounds both read on the navy stage. Size comes from the parent
 * (className sets height/width); the logo is centred inside with even padding.
 */
export function TeamLogo({
  contestant,
  className = "",
  style,
  priority,
  sizes = "160px",
}: {
  contestant: Contestant;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  sizes?: string;
}) {
  const { logo } = contestant;
  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded-[3px] ${className}`}
      style={{ background: logo.background, aspectRatio: "16 / 10", ...style }}
      data-testid={`logo-${contestant.id}`}
    >
      <Image
        src={logo.src}
        alt={`${contestant.name} logo`}
        fill
        sizes={sizes}
        priority={priority}
        className={logo.fit === "cover" ? "object-cover" : "object-contain p-[8%]"}
      />
    </span>
  );
}
