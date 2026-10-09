import Image from "next/image";
import logoWhite from "../../public/brand/biznis-arena-logo-white.png";
import logoNavy from "../../public/brand/biznis-arena-logo-navy.png";

export function Logo({
  variant = "white",
  className,
  priority,
}: {
  variant?: "white" | "navy";
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={variant === "white" ? logoWhite : logoNavy}
      alt="Бизнис Арена 2026"
      className={className}
      priority={priority}
      style={{ height: "100%", width: "auto" }}
    />
  );
}
