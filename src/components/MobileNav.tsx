import { FileText, TrendingUp, Sun, Grid } from "react-feather";
import { useNavigate, useLocation } from "react-router-dom";

export const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: FileText, label: "Write", path: "/", action: "write" },
    { icon: TrendingUp, label: "Story", path: "/", action: "story" },
    { icon: Sun, label: "Insights", path: "/", action: "insights" },
    { icon: Grid, label: "More", path: "/", action: "more" }
  ];

  const handleNavClick = (action: string) => {
    const element = document.getElementById(action);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/50 px-4 pb-safe">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.action}
                onClick={() => handleNavClick(item.action)}
                className="flex flex-col items-center justify-center gap-1 min-w-[60px] transition-colors"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 hover:bg-primary/20 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
