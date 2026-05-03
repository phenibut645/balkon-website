import { Fragment, ReactNode } from "react";

type ItemBadgeRowProps = {
  badges: ReactNode[];
  className?: string;
};

function joinClassNames(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function ItemBadgeRow({ badges, className }: ItemBadgeRowProps) {
  const visibleBadges = badges.filter(Boolean);
  if (visibleBadges.length === 0) {
    return null;
  }

  return (
    <div className={joinClassNames("item-card-meta", className)}>
      {visibleBadges.map((badge, index) => (
        <Fragment key={index}>{badge}</Fragment>
      ))}
    </div>
  );
}
