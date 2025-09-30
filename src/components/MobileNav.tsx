import { TrendingUp, Sun, Grid, Home } from "react-feather";

export const MobileNav = () => {
  const navItems = [
    { icon: Home, label: "Chat", action: "chat" },
    { icon: TrendingUp, label: "Story", action: "story" },
    { icon: Sun, label: "Insights", action: "insights" },
    { icon: Grid, label: "More", action: "more" }
  ];

  const handleNavClick = (action: string) => {
    const element = document.getElementById(action);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border/50">
      <div className="max-w-md mx-auto px-4 pb-safe">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.action}
                onClick={() => handleNavClick(item.action)}
                className="flex flex-col items-center justify-center gap-0.5 min-w-[60px] transition-colors"
              >
                <Icon className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                <span className="text-[9px] font-medium text-muted-foreground">
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
