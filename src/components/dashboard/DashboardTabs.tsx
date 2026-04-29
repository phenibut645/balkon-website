type DashboardTabsProps<T extends string> = {
  tabItems: Array<{ id: T; label: string }>;
  activeTab: T;
  onTabChange: (tab: T) => void;
};

export function DashboardTabs<T extends string>({ tabItems, activeTab, onTabChange }: DashboardTabsProps<T>) {
  return (
    <div className="tabs-wrap">
      <div className="tabs" role="tablist" aria-label="Dashboard sections">
        {tabItems.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
