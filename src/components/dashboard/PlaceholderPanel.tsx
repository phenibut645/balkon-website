type PlaceholderPanelProps = {
  title: string;
  description: string;
};

export function PlaceholderPanel({ title, description }: PlaceholderPanelProps) {
  return (
    <div className="panel panel-overview">
      <article className="admin-empty-card">
        <p className="display-name">{title}</p>
        <p className="state-text">{description}</p>
      </article>
    </div>
  );
}
