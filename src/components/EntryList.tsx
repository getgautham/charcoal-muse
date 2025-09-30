import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Calendar, Heart, Search } from "lucide-react";

interface Entry {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  ai_insights: string | null;
  created_at: string;
}

interface EntryListProps {
  refresh: number;
}

const EntryList = ({ refresh }: EntryListProps) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, [refresh]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredEntries(entries);
    } else {
      const filtered = entries.filter(entry => 
        entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.mood?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.ai_insights?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEntries(filtered);
    }
  }, [searchTerm, entries]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
      setFilteredEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">Loading entries...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-card">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Heart className="h-6 w-6 text-accent" />
          Your Journal
        </CardTitle>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-border/50 bg-background/50"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm ? "No entries found matching your search." : "No entries yet. Start writing!"}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      {entry.title && (
                        <h3 className="font-semibold text-lg text-foreground mb-1">
                          {entry.title}
                        </h3>
                      )}
                      <p className="text-foreground/80 text-sm line-clamp-3 mb-2">
                        {entry.content}
                      </p>
                    </div>
                    {entry.mood && (
                      <Badge className="bg-accent/20 text-accent border-accent/30 shrink-0">
                        {entry.mood}
                      </Badge>
                    )}
                  </div>
                  
                  {entry.ai_insights && (
                    <div className="mt-3 p-3 rounded bg-primary/10 border border-primary/20">
                      <p className="text-xs text-foreground/80 italic">
                        {entry.ai_insights}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default EntryList;
