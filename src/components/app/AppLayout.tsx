import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  selectedRecipeId?: string;
}

/**
 * AppLayout component - main 2-column master-detail layout
 * Left panel: recipe list with search/filters (collapsible)
 * Right panel: Generator and Preview tabs
 */
export function AppLayout({ selectedRecipeId }: AppLayoutProps) {
  const [currentSelectedId, setCurrentSelectedId] = useState<string | undefined>(selectedRecipeId);

  // Collapsible left panel state - persisted in localStorage
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("leftPanelCollapsed");
      return stored === "true";
    }
    return false;
  });

  // Handle recipe selection from list
  const handleRecipeSelect = (id: string) => {
    setCurrentSelectedId(id);
    // Navigate to recipe detail page
    window.history.pushState({}, "", `/app/recipes/${id}`);

    // Auto-collapse left panel on mobile after selecting a recipe
    // This provides better UX on small screens where the panel overlays the preview
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsLeftPanelCollapsed(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("leftPanelCollapsed", "true");
      }
    }
  };

  // Handle tag click from preview - filter list by tag
  const handleTagClick = (tag: string) => {
    // Update URL to filter by this tag
    const params = new URLSearchParams(window.location.search);
    const currentTags = params.get("tags")?.split(",").filter(Boolean) || [];

    // Add tag if not already present
    if (!currentTags.includes(tag.toLowerCase())) {
      currentTags.push(tag.toLowerCase());
      params.set("tags", currentTags.join(","));

      // Reset offset when changing filters
      params.delete("offset");

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState({}, "", newUrl);

      // Trigger popstate to update filters
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  // Handle "Generate first recipe" CTA from empty state
  const handleGenerateClick = () => {
    // Switch to Generator tab in right panel
    console.log("Switch to Generator tab");
    // This could be implemented by adding tab state management
  };

  // Handle recipe deletion - clear selection
  const handleRecipeDeleted = () => {
    setCurrentSelectedId(undefined);
  };

  // Handle recipe generation - clear selection to show new draft
  const handleRecipeGenerated = () => {
    setCurrentSelectedId(undefined);
    // Navigate back to /app to clear recipe ID from URL
    window.history.pushState({}, "", "/app");
  };

  // Toggle left panel collapse state
  const toggleLeftPanel = () => {
    setIsLeftPanelCollapsed((prev) => {
      const newValue = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("leftPanelCollapsed", String(newValue));
      }
      return newValue;
    });
  };

  // Keyboard shortcut: Ctrl/Cmd + B to toggle left panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        toggleLeftPanel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative grid lg:grid-cols-[auto_1fr] gap-4 h-full">
      {/* Left Panel - Recipe List (Collapsible) */}
      <div
        className={cn(
          "flex flex-col h-full border rounded-lg bg-card transition-all duration-300 ease-in-out",
          // Desktop behavior - slide left
          "lg:relative",
          isLeftPanelCollapsed ? "lg:w-0 lg:overflow-hidden lg:border-0 lg:p-0 lg:gap-0" : "lg:w-[420px]",
          // Mobile behavior - slide from top with overlay (below header)
          "fixed lg:static left-0 right-0 z-40",
          "max-lg:top-16 max-lg:h-[calc(100vh-5rem)] max-lg:mx-4 max-lg:shadow-xl",
          isLeftPanelCollapsed
            ? "max-lg:-translate-y-[calc(100%+5rem)] max-lg:opacity-0 max-lg:pointer-events-none"
            : "max-lg:translate-y-0 max-lg:opacity-100"
        )}
      >
        <LeftPanel
          selectedId={currentSelectedId}
          onSelect={handleRecipeSelect}
          onGenerateClick={handleGenerateClick}
          onToggleCollapse={toggleLeftPanel}
        />
      </div>

      {/* Toggle Button - Visible when collapsed */}
      {isLeftPanelCollapsed && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={toggleLeftPanel}
                variant="outline"
                size="icon"
                className={cn(
                  "fixed z-50 shadow-lg hover:shadow-xl transition-shadow",
                  // Desktop: Fixed to left edge
                  "lg:top-20 lg:left-4",
                  // Mobile: Fixed to top center (below header)
                  "max-lg:top-16 max-lg:left-1/2 max-lg:-translate-x-1/2"
                )}
                aria-label="Show recipe list"
              >
                {/* Desktop icon */}
                <ChevronRight className="h-4 w-4 hidden lg:block" />
                {/* Mobile icon */}
                <ChevronDown className="h-4 w-4 lg:hidden" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="hidden lg:block">
              <p>Show recipe list</p>
              <p className="text-xs text-muted-foreground">Ctrl+B</p>
            </TooltipContent>
            <TooltipContent side="bottom" className="lg:hidden">
              <p>Show recipe list</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Right Panel - Generator & Preview */}
      <div
        className={cn(
          "flex flex-col h-full border rounded-lg bg-card transition-all duration-300",
          // Hide on mobile when left panel is visible
          !isLeftPanelCollapsed && "max-lg:hidden"
        )}
      >
        <RightPanel
          selectedRecipeId={currentSelectedId}
          onTagClick={handleTagClick}
          onRecipeDeleted={handleRecipeDeleted}
          onRecipeGenerated={handleRecipeGenerated}
        />
      </div>

      {/* Mobile overlay backdrop when panel is open */}
      {!isLeftPanelCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity duration-300"
          onClick={toggleLeftPanel}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
