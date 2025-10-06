import { Link } from "react-router-dom";
import { Circle, Telescope, Compass, Archive, Waves } from "lucide-react";

interface BottomNavProps {
  currentPath: string;
}

export const BottomNav = ({ currentPath }: BottomNavProps) => {
  const navItems = [
    { path: "/mirror", icon: Circle, label: "Mirror", color: "#A9A9A9" },
    { path: "/lens", icon: Telescope, label: "Lens", color: "#7057D8" },
    { path: "/compass", icon: Compass, label: "Compass", color: "#F6B74C" },
    { path: "/archive", icon: Archive, label: "Archive", color: "#E8DCC0" },
    { path: "/stream", icon: Waves, label: "Stream", color: "#6EB5D3" },
  ];

  const isActive = (path: string) => {
    return currentPath === path || (path === "/mirror" && currentPath === "/");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t-2 border-border shadow-[0px_-4px_0px_hsl(var(--border))]">
      <div className="max-w-6xl mx-auto flex items-center justify-around px-2 py-3 safe-area-bottom">
        {navItems.map(({ path, icon: Icon, label, color }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              className="flex flex-col items-center gap-1 transition-all hover-scale"
              style={{
                transform: active ? 'scale(1.1)' : 'scale(1)',
                filter: active ? `drop-shadow(0 0 10px ${color}40)` : 'none'
              }}
            >
              <Icon 
                className="w-6 h-6 transition-all"
                strokeWidth={1.5}
                style={{
                  color: active ? color : '#9E9E9E',
                  opacity: active ? 1 : 0.6
                }}
              />
              <span 
                className="text-xs font-medium transition-all"
                style={{
                  color: active ? color : '#9E9E9E',
                  opacity: active ? 1 : 0.6
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
