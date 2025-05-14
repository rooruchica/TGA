import React from "react";
import Navbar from "./navbar";
import BottomNavigation from "./bottom-navigation";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <BottomNavigation />
    </div>
  );
}

export default Layout; 