"use client";

import { AdminTab, DashboardMode, DashboardTab, UserTab } from "@/lib/dashboardSearch";
import { DashboardText } from "@/lib/dashboardText";
import { ShopSubTab } from "@/lib/types";

type SidebarItem = {
  key: string;
  label: string;
  icon: string;
  active?: boolean;
  disabled?: boolean;
  soon?: boolean;
  soonLabel?: string;
  title?: string;
  onClick?: () => void;
};

type SidebarSection = {
  title: string;
  items: SidebarItem[];
};

type DashboardSidebarProps = {
  t: DashboardText;
  dashboardMode: DashboardMode;
  activeTab: DashboardTab;
  shopSubTab: ShopSubTab;
  onUserTabSelect: (tab: UserTab) => void;
  onAdminTabSelect: (tab: AdminTab) => void;
  onShopSubTabSelect: (subtab: ShopSubTab) => void;
};

function SidebarSectionView({ section }: { section: SidebarSection }) {
  return (
    <div className="sidebar-section">
      <p className="sidebar-section-title">{section.title}</p>
      <div className="sidebar-section-items">
        {section.items.map(item => (
          <button
            key={item.key}
            type="button"
            className={`sidebar-nav-item ${item.active ? "active" : ""} ${item.disabled ? "disabled" : ""}`}
            onClick={item.disabled ? undefined : item.onClick}
            disabled={item.disabled}
            aria-current={item.active ? "page" : undefined}
            title={item.title || (item.disabled ? item.label : undefined)}
          >
            <span className="sidebar-icon-bubble" aria-hidden="true">{item.icon}</span>
            <span className="sidebar-nav-label">{item.label}</span>
            {item.soon ? <span className="sidebar-soon-pill">{item.soonLabel}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DashboardSidebar({
  t,
  dashboardMode,
  activeTab,
  shopSubTab,
  onUserTabSelect,
  onAdminTabSelect,
  onShopSubTabSelect,
}: DashboardSidebarProps) {
  const botShopGeneralActive = activeTab === "botShop" && shopSubTab !== "obs";
  const obsActive = activeTab === "botShop" && shopSubTab === "obs";

  const userSections: SidebarSection[] = [
    {
      title: t.navMain,
      items: [
        {
          key: "overview",
          label: t.tabOverview,
          icon: "🏠",
          active: activeTab === "overview",
          onClick: () => onUserTabSelect("overview"),
        },
      ],
    },
    {
      title: t.navPersonal,
      items: [
        {
          key: "profile",
          label: t.tabProfile,
          icon: "👤",
          active: activeTab === "profile",
          onClick: () => onUserTabSelect("profile"),
        },
        {
          key: "inventory",
          label: t.tabInventory,
          icon: "🎒",
          active: activeTab === "inventory",
          onClick: () => onUserTabSelect("inventory"),
        },
        {
          key: "notifications",
          label: t.tabNotifications,
          icon: "🔔",
          active: activeTab === "notifications",
          onClick: () => onUserTabSelect("notifications"),
        },
      ],
    },
    {
      title: t.navEconomy,
      items: [
        {
          key: "market",
          label: t.tabMarket,
          icon: "📈",
          active: activeTab === "market",
          onClick: () => onUserTabSelect("market"),
        },
        {
          key: "bot-shop",
          label: t.tabBotShop,
          icon: "🛒",
          active: botShopGeneralActive,
          onClick: () => onShopSubTabSelect("overview"),
        },
        {
          key: "craft",
          label: t.tabCraft,
          icon: "🛠",
          active: activeTab === "craft",
          onClick: () => onUserTabSelect("craft"),
        },
      ],
    },
    {
      title: t.navObs,
      items: [
        {
          key: "obs-shop",
          label: t.obsShop,
          icon: "🎥",
          active: obsActive,
          onClick: () => onShopSubTabSelect("obs"),
        },
        {
          key: "obs-history",
          label: t.obsHistory,
          icon: "▣",
          active: false,
          onClick: () => onShopSubTabSelect("obs"),
        },
      ],
    },
    {
      title: t.navServers,
      items: [
        {
          key: "servers",
          label: t.myServers,
          icon: "🛡",
          active: activeTab === "servers",
          onClick: () => onUserTabSelect("servers"),
        },
      ],
    },
  ];

  const adminSections: SidebarSection[] = [
    {
      title: t.navAdmin,
      items: [
        {
          key: "admin-dashboard",
          label: t.adminTabDashboard,
          icon: "⚙",
          active: activeTab === "adminDashboard",
          onClick: () => onAdminTabSelect("adminDashboard"),
        },
        {
          key: "admin-servers",
          label: t.adminTabServers,
          icon: "🛡",
          active: activeTab === "adminServers",
          onClick: () => onAdminTabSelect("adminServers"),
        },
        {
          key: "admin-logs",
          label: t.adminTabLogs,
          icon: "▤",
          active: activeTab === "adminLogs",
          onClick: () => onAdminTabSelect("adminLogs"),
        },
        {
          key: "admin-obs",
          label: t.adminTabObs,
          icon: "🎥",
          active: activeTab === "adminObs",
          onClick: () => onAdminTabSelect("adminObs"),
        },
        {
          key: "admin-items",
          label: t.adminTabItems,
          icon: "🎒",
          active: activeTab === "adminItems",
          onClick: () => onAdminTabSelect("adminItems"),
        },
        {
          key: "admin-economy",
          label: t.adminEconomy,
          icon: "💰",
          active: activeTab === "adminEconomy",
          onClick: () => onAdminTabSelect("adminEconomy"),
        },
        {
          key: "admin-bot-shop",
          label: t.adminTabBotShop,
          icon: "🛒",
          active: activeTab === "adminBotShop",
          onClick: () => onAdminTabSelect("adminBotShop"),
        },
        {
          key: "admin-message",
          label: t.adminBroadcast,
          icon: "📣",
          active: activeTab === "adminMessage",
          onClick: () => onAdminTabSelect("adminMessage"),
        },
      ],
    },
  ];

  const sections = dashboardMode === "admin" ? adminSections : userSections;

  return (
    <aside className="dashboard-sidebar" aria-label={dashboardMode === "admin" ? t.navAdmin : t.navMain}>
      {sections.map(section => (
        <SidebarSectionView key={section.title} section={section} />
      ))}
    </aside>
  );
}
