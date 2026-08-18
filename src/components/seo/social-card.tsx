const colors = {
  leather: "#160b0b",
  leatherLight: "#2a1514",
  parchment: "#efe3c8",
  parchmentDeep: "#dccaa6",
  ink: "#292727",
  mutedInk: "#62584d",
  brass: "#bd955c",
  good: "#3c7fa2",
  evil: "#9a4147",
} as const;

const townTokens = Array.from({ length: 12 }, (_, index) => {
  const angle = (index / 12) * Math.PI * 2 - Math.PI / 2;
  return {
    left: `${50 + Math.cos(angle) * 42}%`,
    top: `${50 + Math.sin(angle) * 42}%`,
    color: index < 8 ? colors.good : colors.evil,
  };
});

export function SocialCard({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        padding: 32,
        color: colors.ink,
        background: `radial-gradient(circle at 18% 12%, ${colors.leatherLight} 0%, ${colors.leather} 62%)`,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          overflow: "hidden",
          border: `2px solid ${colors.brass}`,
          borderRadius: 22,
          background: `linear-gradient(135deg, ${colors.parchment} 0%, ${colors.parchmentDeep} 100%)`,
          boxShadow: "0 20px 56px rgba(0, 0, 0, 0.38)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 16,
            display: "flex",
            border: "1px solid rgba(88, 57, 36, 0.24)",
            borderRadius: 13,
          }}
        />

        <div
          style={{
            width: "66%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "54px 38px 48px 68px",
          }}
        >
          <div
            style={{
              display: "flex",
              marginBottom: 22,
              color: colors.evil,
              fontFamily: "monospace",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.14em",
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              display: "flex",
              whiteSpace: "pre-line",
              fontFamily: "serif",
              fontSize: 86,
              fontWeight: 700,
              letterSpacing: "-0.045em",
              lineHeight: 0.86,
            }}
          >
            {title}
          </div>
          <div
            style={{
              width: 580,
              display: "flex",
              marginTop: 28,
              color: colors.mutedInk,
              fontSize: 27,
              lineHeight: 1.28,
            }}
          >
            {description}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 30,
              color: colors.evil,
              fontFamily: "monospace",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          >
            BOTC.TOWN
          </div>
        </div>

        <div
          style={{
            width: "34%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingRight: 40,
          }}
        >
          <div
            style={{
              width: 310,
              height: 310,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `2px solid ${colors.brass}`,
              borderRadius: 999,
              background: "rgba(39, 27, 23, 0.06)",
              boxShadow:
                "inset 0 0 0 12px rgba(255,255,255,0.18), inset 0 0 42px rgba(78,48,19,0.16)",
            }}
          >
            {townTokens.map((token, index) => (
              <div
                key={index}
                style={{
                  width: 31,
                  height: 31,
                  position: "absolute",
                  left: token.left,
                  top: token.top,
                  display: "flex",
                  border: `3px solid ${colors.parchment}`,
                  borderRadius: 999,
                  background: token.color,
                  boxShadow: "0 2px 7px rgba(34, 20, 16, 0.35)",
                  transform: "translate(-50%, -50%)",
                }}
              />
            ))}
            <div
              style={{
                width: 174,
                height: 174,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                border: "1px solid rgba(69, 43, 29, 0.24)",
                borderRadius: 999,
                color: colors.ink,
                fontFamily: "serif",
                fontSize: 29,
                fontWeight: 700,
                letterSpacing: "0.11em",
                lineHeight: 1.05,
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex" }}>TOWN</div>
              <div style={{ display: "flex" }}>CIRCLE</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
