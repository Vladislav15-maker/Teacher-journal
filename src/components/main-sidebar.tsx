"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppLogo } from "@/components/icons";
import { BookMarked, Users, CalendarCheck, Mail, Settings, LogOut } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import { signOut } from "next-auth/react";


const navItems = [
  { href: "/", icon: BookMarked, label: "Журнал" },
  { href: "/classes", icon: Users, label: "Мои классы" },
  { href: "/attendance", icon: CalendarCheck, label: "Посещаемость" },
  { href: "/messages", icon: Mail, label: "Сообщения" },
];

const settingsItem = { href: "/settings", icon: Settings, label: "Настройки" };

export function MainSidebar() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <AppLogo className="w-6 h-6 text-primary" />
            <span className="text-lg font-semibold">Teacher's Journal</span>
            {isMobile && <SidebarTrigger className="ml-auto" />}
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Button
                variant={isActive(item.href) ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Button
                variant={isActive(settingsItem.href) ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
              <Link href={settingsItem.href}>
                <settingsItem.icon className="mr-2 h-4 w-4" />
                {settingsItem.label}
              </Link>
            </Button>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleSignOut}
              >
              <LogOut className="mr-2 h-4 w-4" />
              Выйти
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
