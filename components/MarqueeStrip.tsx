"use client";
type Props = { items?: string[]; speed?: "slow" | "normal" | "fast" };

export default function MarqueeStrip({
  items = [
    "404 HEX NOT FOUND",
    "WE NOTICED",
    "BRING IT BACK",
    "THE SIGNAL IS GLOBAL",
    "WE ARE FREELONS",
    "STRONGER TOGETHER",
  ],
  speed = "normal",
}: Props) {
  // Repeat content twice for seamless loop
  const repeated = [...items, ...items];
  return (
    <div className="marquee-strip">
      <div className="marquee-track">
        {repeated.map((it, i) => (
          <span key={i}>
            {it.includes("NOT FOUND") ? (
              <>404 HEX <span className="alt">NOT FOUND</span></>
            ) : (
              it
            )}
            <span className="dot" />
          </span>
        ))}
      </div>
    </div>
  );
}
