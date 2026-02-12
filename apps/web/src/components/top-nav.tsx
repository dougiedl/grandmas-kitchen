"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/profile", label: "Profile" },
  { href: "/recipes", label: "Recipes" },
];

export function TopNav({ showAdmin }: { showAdmin: boolean }) {
  const pathname = usePathname();
  const navItems = showAdmin
    ? [...NAV_ITEMS, { href: "/admin/evals", label: "Admin" }]
    : NAV_ITEMS;

  return (
    <nav aria-label="Primary navigation" className="top-nav">
      {navItems.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={isActive ? "nav-link nav-link-active" : "nav-link"}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
