import { LayoutDashboard, PackagePlus, History, BarChart3, Inbox, Boxes, Factory, Truck } from "lucide-react";

/* One nav map for the whole app. Each role sees only its own pages. */
export const NAV = {
  Distributor: {
    home: "/distributor-dashboard/dis_dashboard",
    items: [
      { href: "/distributor-dashboard/dis_dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/distributor-dashboard/dis_order_placement", label: "Place order", icon: PackagePlus },
      { href: "/distributor-dashboard/dis_order_history", label: "Orders", icon: History },
      { href: "/distributor-dashboard/dis_analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  "Warehouse Manager": {
    home: "/warehouse-dashboard/war_dashboard",
    items: [
      { href: "/warehouse-dashboard/war_dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/warehouse-dashboard/war_rec_orders", label: "Incoming orders", icon: Inbox },
      { href: "/warehouse-dashboard/war_order_placement", label: "Restock", icon: PackagePlus },
      { href: "/warehouse-dashboard/war_analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  "Production Manager": {
    home: "/production-dashboard/pro_dashboard",
    items: [
      { href: "/production-dashboard/pro_dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/production-dashboard/pro_rec_orders", label: "Production queue", icon: Factory },
      { href: "/production-dashboard/pro_materials", label: "Raw materials", icon: Boxes },
    ],
  },
  Vendor: {
    home: "/vendor-dashboard/ven_dashboard",
    items: [
      { href: "/vendor-dashboard/ven_dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/vendor-dashboard/ven_orders", label: "Supply requests", icon: Truck },
    ],
  },
};

export const ROLE_LABEL = {
  Distributor: "Distributor",
  "Warehouse Manager": "Warehouse",
  "Production Manager": "Production",
  Vendor: "Vendor",
};
