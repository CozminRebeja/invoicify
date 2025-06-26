'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive =
            pathname === item.url ||
            (item.url !== '/' &&
              pathname.startsWith(item.url) &&
              pathname.split('/')[1] === item.url.split('/')[1]);

          return (
            <SidebarMenuItem key={item.title}>
              <Link href={item.url}>
                <SidebarMenuButton
                  tooltip={item.title}
                  className={cn(
                    'group/item',
                    isActive && 'bg-primary/10 text-primary'
                  )}
                >
                  {item.icon && <item.icon className="h-5 w-5 flex-shrink-0" />}
                  <span className="mx-2 flex-grow truncate">{item.title}</span>
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 flex-shrink-0 transition-all duration-300 ease-in-out',
                      isActive
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 -translate-x-2',
                      'group-hover/item:opacity-100 group-hover/item:translate-x-0'
                    )}
                  />
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
