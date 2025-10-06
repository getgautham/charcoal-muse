import { Link } from "react-router-dom";
import { Circle, Telescope, Compass, Archive, Sparkles } from "lucide-react";

interface BottomNavProps {
  currentPath: string;
}

export const BottomNav = ({ currentPath }: BottomNavProps) => {
  const navItems = [
    { path: "/mirror", icon: Circle, label: "Mirror" },
    { path: "/lens", icon: Telescope, label: "Lens" },
    { path: "/compass", icon: Compass, label: "Compass" },
    { path: "/archive", icon: Archive, label: "Archive" },
  ];

  const isActive = (path: string) => {
    return currentPath === path || (path === "/mirror" && currentPath === "/");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t-2 border-border shadow-[0px_-4px_0px_hsl(var(--border))]">
      <div className="max-w-6xl mx-auto flex items-center justify-around px-4 py-3 safe-area-bottom">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              className="flex flex-col items-center gap-1 transition-all"
            >
              <Icon 
                className={`w-6 h-6 transition-all ${
                  active ? "text-primary opacity-100" : "text-muted-foreground opacity-60"
                }`}
                strokeWidth={1.5}
              />
              <span className={`text-xs font-medium transition-all ${
                active ? "text-foreground" : "text-muted-foreground opacity-60"
              }`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
