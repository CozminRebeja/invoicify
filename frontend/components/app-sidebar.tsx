'use client';

import * as React from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  BarChart3,
  Settings2,
} from 'lucide-react';

import { NavMain } from '@/components/nav-main'; // Assuming this component can render the new nav items
import { NavUser } from '@/components/nav-user'; //
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';

const invoiceAppData = {
  user: {
    // PLACEHOLDER
    name: 'Rebeja Cozmin',
    email: '24imc10535@fh-krems.ac.at',
    avatar: '/avatars/default-user.png',
  },
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Invoices',
      url: '/invoices',
      icon: FileText,
    },
    {
      title: 'Clients',
      url: '/clients',
      icon: Users,
    },
    // {
    //   title: 'Services',
    //   url: '/services',
    //   icon: Package,
    // },
    // {
    //   title: 'Reports',
    //   url: '/reports',
    //   icon: BarChart3,
    // },
    // {
    //   title: 'Settings',
    //   url: '/settings',
    //   icon: Settings2,
    // },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex gap-2">
          <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center">
            <img src={'/brand/logomark.png'} />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">Invoicity</span>
            <span className="truncate text-xs">Manage with ease.</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={invoiceAppData.navMain} /> {/* */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={invoiceAppData.user} /> {/* */}
      </SidebarFooter>
    </Sidebar>
  );
}
