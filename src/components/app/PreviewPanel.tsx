import { RecipePreview } from "./RecipePreview";
import { SaveButton } from "./SaveButton";
import { DeleteButton } from "./DeleteButton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, RotateCcw } from "lucide-react";
import { useSaveRecipeMutation, useDeleteRecipeMutation } from "@/lib/api/recipes";
import { useProfileQuery } from "@/lib/api/profile";
import type { RecipeSchema, RecipeDetailsDTO, RecipeSummaryDTO, PreviewMode } from "@/types";
import { toast } from "sonner";

interface PreviewPanelProps {
  mode: PreviewMode;
  recipe?: RecipeSchema;
  details?: RecipeDetailsDTO;
  onSaved?: (summary: RecipeSummaryDTO) => void;
  onDeleted?: (id: string) => void;
  onTagClick?: (tag: string) => void;
  onRestoreDraft?: () => void;
}

/**
 * PreviewPanel component - displays recipe preview with actions
 * Modes: 'draft' (from generator) or 'saved' (from database)
 * Handles save, delete, and tag filtering
 */
export function PreviewPanel({
  mode,
  recipe,
  details,
  onSaved,
  onDeleted,
  onTagClick,
  onRestoreDraft,
}: PreviewPanelProps) {
  const { data: profile } = useProfileQuery();
  const saveMutation = useSaveRecipeMutation();
  const deleteMutation = useDeleteRecipeMutation();

  // Check if recipe contains disliked ingredients
  const checkDislikedIngredients = (recipeData: RecipeSchema): string | null => {
    if (!profile?.disliked_ingredients || profile.disliked_ingredients.length === 0) {
      return null;
    }

    const dislikedList = profile.disliked_ingredients.map((i) => i.toLowerCase());
    const ingredientsList = recipeData.ingredients.map((i) => i.toLowerCase());

    const found = dislikedList.find((disliked) => ingredientsList.some((ingredient) => ingredient.includes(disliked)));

    if (found) {
      return `This recipe contains "${found}" which is in your disliked ingredients list.`;
    }

    return null;
  };

  const handleSave = () => {
    if (!recipe) return;

    saveMutation.mutate(
      { recipe, tags: recipe.tags },
      {
        onSuccess: (summary) => {
          toast.success("Recipe saved successfully!");
          onSaved?.(summary);
        },
        onError: (error: any) => {
          toast.error(error.message || "Failed to save recipe");
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Recipe deleted successfully!");
        onDeleted?.(id);
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to delete recipe");
      },
    });
  };

  // Empty state
  if (!recipe && !details) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <FileText className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No recipe selected</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Select a recipe from the list or generate a new one using AI to see it here.
        </p>
      </div>
    );
  }

  const displayData = mode === "saved" && details ? details : recipe;
  if (!displayData) return null;

  const disabledReason = mode === "draft" && recipe ? checkDislikedIngredients(recipe) : null;
  const canSave = mode === "draft" && !disabledReason;

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Disliked ingredients warning */}
        {disabledReason && (
          <Alert>
            <AlertDescription>{disabledReason}</AlertDescription>
          </Alert>
        )}

        {/* Recipe preview */}
        <RecipePreview data={displayData} onTagClick={onTagClick} readonly={mode === "saved"} />

        {/* Actions bar - bottom */}
        <div className="flex items-center justify-between gap-3 pt-6 border-t">
          {/* Left side - primary actions (Save, Edit) */}
          <div className="flex flex-wrap gap-3">
            {mode === "draft" && recipe && (
              <>
                <SaveButton
                  onClick={handleSave}
                  disabled={!canSave || saveMutation.isPending}
                  loading={saveMutation.isPending}
                  disabledReason={disabledReason || undefined}
                />
                {onRestoreDraft && (
                  <Button variant="outline" size="lg" onClick={onRestoreDraft} className="gap-2">
                    <RotateCcw className="h-5 w-5" />
                    Restore from draft
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Right side - destructive actions (Delete) */}
          <div className="flex flex-wrap gap-3">
            {mode === "saved" && details && (
              <DeleteButton
                recipeId={details.id}
                recipeName={details.title}
                onDeleted={handleDelete}
                loading={deleteMutation.isPending}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
