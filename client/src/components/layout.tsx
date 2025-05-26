import React from "react";
import Navbar from "./navbar";

interface LayoutProps {
  children: React.ReactNode;
  forceGuide?: boolean;
}

export function Layout({ children, forceGuide }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar forceGuide={forceGuide} />
      <main className="flex-1">{children}</main>
    </div>
  );
}

export default Layout; 