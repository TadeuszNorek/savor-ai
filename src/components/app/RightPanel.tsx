import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneratorPanel } from "./GeneratorPanel";
import { PreviewPanel } from "./PreviewPanel";
import { useRecipeDetails } from "@/lib/api/recipes";
import { useI18n } from "@/lib/contexts/I18nContext";
import type { RecipeSchema, GenerateRecipeResponse, RecipeSummaryDTO } from "@/types";

interface RightPanelProps {
  selectedRecipeId?: string;
  onTagClick?: (tag: string) => void;
  onRecipeDeleted?: () => void;
  onRecipeGenerated?: () => void;
}

type ActiveTab = "generator" | "preview";

/**
 * RightPanel component - tabbed interface for Generator and Preview
 * Auto-switches to Preview after successful generation
 * Supports deep-linking to saved recipe details
 */
export function RightPanel({ selectedRecipeId, onTagClick, onRecipeDeleted, onRecipeGenerated }: RightPanelProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<ActiveTab>("preview");
  const [draftRecipe, setDraftRecipe] = useState<RecipeSchema | undefined>();

  // Fetch selected recipe details (if deep-linked)
  const { data: selectedRecipe } = useRecipeDetails(selectedRecipeId || "");

  // Switch to preview when recipe is selected via deep-link
  useEffect(() => {
    if (selectedRecipeId && selectedRecipe) {
      setActiveTab("preview");
    }
  }, [selectedRecipeId, selectedRecipe]);

  // Handle hash navigation (#generator)
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#generator") {
        setActiveTab("generator");
        // Clear hash without adding to history
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    };

    // Check on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Handle successful generation - switch to preview and show draft
  const handleGenerated = (response: GenerateRecipeResponse) => {
    setDraftRecipe(response.recipe);
    setActiveTab("preview");
    // Clear any selected recipe from list to show the new draft
    onRecipeGenerated?.();
  };

  // Handle successful save - could navigate to saved recipe
  const handleSaved = (summary: RecipeSummaryDTO) => {
    // Clear draft after save
    setDraftRecipe(undefined);
    // Could trigger navigation to /app/recipes/:id here
    console.log("Recipe saved:", summary.id);
  };

  // Handle delete - clear selection and stay on preview tab
  const handleDeleted = () => {
    // Stay on preview tab - it will show "No recipe selected" placeholder
    // Notify parent to clear selection
    onRecipeDeleted?.();
    // Navigate back to /app (clear recipe ID from URL)
    window.history.pushState({}, "", "/app");
  };

  // Restore draft from sessionStorage
  const handleRestoreDraft = () => {
    const stored = sessionStorage.getItem("generatorDraft");
    if (stored) {
      try {
        const draft = JSON.parse(stored);
        setDraftRecipe(draft.recipe);
      } catch (error) {
        console.error("Failed to restore draft:", error);
      }
    }
  };

  // Determine preview mode and data
  const previewMode = selectedRecipeId && selectedRecipe ? "saved" : "draft";
  const showDraft = !selectedRecipeId && draftRecipe;
  const showSaved = selectedRecipeId && selectedRecipe;

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)} className="flex-1 flex flex-col">
        <TabsList className="w-full">
          <TabsTrigger value="generator" className="flex-1">
            {t('tabs.generator')}
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex-1">
            {t('tabs.preview')}
            {(showDraft || showSaved) && <span className="ml-2 h-2 w-2 rounded-full bg-primary" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="flex-1 overflow-hidden mt-0">
          <div className="h-full overflow-y-auto">
            <GeneratorPanel onGenerated={handleGenerated} />
          </div>
        </TabsContent>

        <TabsContent value="preview" className="flex-1 overflow-hidden mt-0">
          <PreviewPanel
            mode={previewMode}
            recipe={showDraft ? draftRecipe : undefined}
            details={showSaved ? selectedRecipe : undefined}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
            onTagClick={onTagClick}
            onRestoreDraft={handleRestoreDraft}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
