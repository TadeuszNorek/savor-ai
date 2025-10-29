import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RecipeListItemDTO } from "@/types";

interface RecipeCardProps {
  item: RecipeListItemDTO;
  selected?: boolean;
  onClick: () => void;
}

/**
 * RecipeCard component - displays a single recipe in the list
 * Shows title, summary, and tags
 */
export function RecipeCard({ item, selected = false, onClick }: RecipeCardProps) {
  return (
    <Card
      className={`p-4 cursor-pointer transition-colors hover:bg-accent ${selected ? "border-primary bg-accent" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-pressed={selected}
    >
      <div className="space-y-2">
        <h3 className="font-semibold text-lg line-clamp-2">{item.title}</h3>

        {item.summary && <p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p>}

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
