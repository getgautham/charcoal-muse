interface MirrorInsightProps {
  content: string;
  mood?: string;
  timestamp: string;
}

export const MirrorInsight = ({ content, mood, timestamp }: MirrorInsightProps) => {
  return (
    <div className="card-brutal bg-muted p-4 rounded-md">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
        🪞 Mirror
      </div>
      <p className="text-sm text-foreground leading-relaxed">
        {content}
      </p>
      {mood && (
        <div className="mt-3 pt-3 border-t-2 border-border">
          <span className="text-xs font-medium text-foreground capitalize">
            Pattern: {mood}
          </span>
        </div>
      )}
      <p className="text-[10px] text-muted-foreground mt-2">
        {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
};
