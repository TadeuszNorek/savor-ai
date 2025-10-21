import { useState } from "react";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";

interface AppLayoutProps {
  selectedRecipeId?: string;
}

/**
 * AppLayout component - main 2-column master-detail layout
 * Left panel: recipe list with search/filters
 * Right panel: Generator and Preview tabs
 */
export function AppLayout({ selectedRecipeId }: AppLayoutProps) {
  const [currentSelectedId, setCurrentSelectedId] = useState<string | undefined>(
    selectedRecipeId
  );

  // Handle recipe selection from list
  const handleRecipeSelect = (id: string) => {
    setCurrentSelectedId(id);
    // Navigate to recipe detail page
    window.history.pushState({}, "", `/app/recipes/${id}`);
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

  return (
    <div className="grid lg:grid-cols-[420px_1fr] gap-4 h-full">
      {/* Left Panel - Recipe List */}
      <div className="flex flex-col h-full border rounded-lg bg-card">
        <LeftPanel
          selectedId={currentSelectedId}
          onSelect={handleRecipeSelect}
          onGenerateClick={handleGenerateClick}
        />
      </div>

      {/* Right Panel - Generator & Preview */}
      <div className="flex flex-col h-full border rounded-lg bg-card">
        <RightPanel
          selectedRecipeId={currentSelectedId}
          onTagClick={handleTagClick}
          onRecipeDeleted={handleRecipeDeleted}
          onRecipeGenerated={handleRecipeGenerated}
        />
      </div>
    </div>
  );
}
