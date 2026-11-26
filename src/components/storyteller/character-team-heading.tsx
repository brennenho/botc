import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";

type CharacterTeamHeadingProps = {
  label: string;
  detail?: string;
  count?: { selected: number; target: number | undefined };
  disclosure?: {
    expanded: boolean;
    contentId: string;
    onToggle: () => void;
  };
};

export function CharacterTeamHeading({
  label,
  detail,
  count,
  disclosure,
}: CharacterTeamHeadingProps) {
  const heading = (
    <span className="token-team-heading">
      <span>{label}</span>
      {detail && <small>{detail}</small>}
    </span>
  );

  return (
    <h3>
      {disclosure ? (
        <Button
          type="button"
          variant="quiet"
          size="sm"
          focusStyle="surface"
          className="token-team-toggle"
          aria-expanded={disclosure.expanded}
          aria-controls={disclosure.contentId}
          onClick={disclosure.onToggle}
        >
          {heading}
          <ChevronDown aria-hidden="true" />
        </Button>
      ) : (
        heading
      )}
      {count && (
        <span
          className="token-team-count"
          aria-label={`${count.selected} in setup${count.target === undefined ? "" : `, ${count.target} expected`}`}
        >
          <strong>{count.selected}</strong>
          {count.target !== undefined && (
            <>
              <span aria-hidden="true">/</span>
              <span>{count.target}</span>
            </>
          )}
        </span>
      )}
    </h3>
  );
}
