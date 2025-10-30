import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ChefHat, Flame, CheckCircle2, Beef, Wheat, Droplet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecipeSchema, RecipeDetailsDTO } from "@/types";

interface RecipePreviewProps {
  data: RecipeSchema | RecipeDetailsDTO;
  onTagClick?: (tag: string) => void;
  readonly?: boolean;
}

/**
 * RecipePreview component - renders recipe JSON to semantic HTML
 * Displays title, times, servings, attributes, ingredients, instructions, and tags
 * Interactive: servings adjuster, checkable ingredients and steps
 */
export function RecipePreview({ data, onTagClick, readonly = false }: RecipePreviewProps) {
  const recipe = "recipe" in data ? (data as RecipeDetailsDTO).recipe : (data as RecipeSchema);
  const tags = "tags" in data && Array.isArray(data.tags) ? data.tags : recipe.tags || [];

  // Deterministic color palette for tags (hash-based)
  const tagColorPalette = [
    "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border-pink-200 dark:border-pink-800",
    "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800",
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    "bg-lime-100 text-lime-700 dark:bg-lime-950/40 dark:text-lime-300 border-lime-200 dark:border-lime-800",
  ];

  // Simple hash function for deterministic color assignment
  const getTagColor = (tag: string) => {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    return tagColorPalette[Math.abs(hash) % tagColorPalette.length];
  };

  // Interactive state
  const [currentServings, setCurrentServings] = useState(recipe.servings);
  const [completedIngredients, setCompletedIngredients] = useState<Set<number>>(new Set());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Scaling ratio for ingredients and nutrition
  const scalingRatio = currentServings / recipe.servings;

  // Helper to scale ingredient strings (looks for numbers and scales them)
  const scaleIngredient = (ingredient: string) => {
    if (scalingRatio === 1) return ingredient;
    return ingredient.replace(/(\d+(\.\d+)?)/g, (match) => {
      const num = parseFloat(match);
      const scaled = num * scalingRatio;
      return Number.isInteger(scaled) ? scaled.toString() : scaled.toFixed(1).replace(/\.0$/, "");
    });
  };

  const toggleIngredient = (index: number) => {
    const next = new Set(completedIngredients);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setCompletedIngredients(next);
  };

  const toggleStep = (index: number) => {
    const next = new Set(completedSteps);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setCompletedSteps(next);
  };

  const difficultyColors = {
    easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    hard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <article className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">{recipe.title}</h1>
          {recipe.cuisine && <p className="text-muted-foreground/70 italic text-sm">{recipe.cuisine}</p>}
        </div>

        {recipe.summary && <p className="text-lg text-muted-foreground leading-relaxed">{recipe.summary}</p>}

        {recipe.description && <p className="text-muted-foreground leading-relaxed">{recipe.description}</p>}

        {/* Tags and Dietary Info */}
        {(tags.length > 0 || (recipe.dietary_info && Object.keys(recipe.dietary_info).length > 0)) && (
          <div className="flex flex-wrap gap-2">
            {/* Dietary info badges - pill style with border-2 */}
            {recipe.dietary_info &&
              Object.entries(recipe.dietary_info).map(
                ([key, value]) =>
                  value && (
                    <Badge
                      key={key}
                      variant="outline"
                      className="rounded-full border-2 bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700 px-3"
                    >
                      {key.replace(/_/g, " ")}
                    </Badge>
                  )
              )}

            {/* Regular tags - square with rounded corners */}
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={cn(
                  "transition-all border",
                  getTagColor(tag),
                  onTagClick && !readonly && "cursor-pointer hover:scale-105 hover:shadow-sm"
                )}
                onClick={() => !readonly && onTagClick?.(tag)}
                role={onTagClick && !readonly ? "button" : undefined}
                tabIndex={onTagClick && !readonly ? 0 : undefined}
                onKeyDown={(e) => {
                  if (!readonly && onTagClick && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onTagClick(tag);
                  }
                }}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Meta information with servings adjuster */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Prep: {recipe.prep_time_minutes}m | Cook: {recipe.cook_time_minutes}m
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ChefHat className="h-4 w-4 text-muted-foreground" />
            <Badge className={difficultyColors[recipe.difficulty]}>{recipe.difficulty}</Badge>
          </div>

          {/* Servings Adjuster */}
          <div className="flex items-center gap-3 bg-primary/5 dark:bg-primary/10 py-2 px-4 rounded-full border border-primary/20">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Serves:</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentServings(Math.max(1, currentServings - 1))}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors active:scale-95"
                aria-label="Decrease servings"
              >
                -
              </button>
              <span className="font-bold text-foreground min-w-[1.5rem] text-center">{currentServings}</span>
              <button
                onClick={() => setCurrentServings(currentServings + 1)}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors active:scale-95"
                aria-label="Increase servings"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <section className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Ingredients</h2>
          <span className="text-sm text-muted-foreground">
            {completedIngredients.size} of {recipe.ingredients.length}
          </span>
        </div>

        <ul className="space-y-3">
          {recipe.ingredients.map((ingredient, index) => {
            const isChecked = completedIngredients.has(index);
            return (
              <li key={index}>
                <button
                  onClick={() => toggleIngredient(index)}
                  className={cn(
                    "group flex items-start gap-3 w-full text-left p-3 rounded-xl transition-all duration-200",
                    isChecked
                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200"
                      : "hover:bg-accent bg-transparent"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                      isChecked ? "border-emerald-500 bg-emerald-500" : "border-border group-hover:border-primary"
                    )}
                  >
                    {isChecked && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <span
                    className={cn(
                      "text-foreground leading-relaxed transition-opacity",
                      isChecked && "line-through opacity-70"
                    )}
                  >
                    {scaleIngredient(ingredient)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Instructions */}
      <section className="border-t pt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Instructions</h2>
          <div className="text-sm font-medium px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary rounded-full">
            Step{" "}
            {completedSteps.size < recipe.instructions.length ? completedSteps.size + 1 : recipe.instructions.length} of{" "}
            {recipe.instructions.length}
          </div>
        </div>

        <ol className="space-y-6">
          {recipe.instructions.map((instruction, index) => {
            const isCompleted = completedSteps.has(index);
            return (
              <li key={index} className="relative flex gap-4 sm:gap-6 group">
                {/* Step connector line */}
                {index !== recipe.instructions.length - 1 && (
                  <div
                    className={cn(
                      "absolute left-4 top-10 bottom-0 w-0.5 -ml-px",
                      isCompleted ? "bg-primary/30" : "bg-border"
                    )}
                    aria-hidden="true"
                  />
                )}

                <button
                  onClick={() => toggleStep(index)}
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all z-10",
                    isCompleted
                      ? "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-background border-border text-primary group-hover:border-primary"
                  )}
                  aria-label={`Toggle step ${index + 1}`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                </button>

                <div
                  className={cn(
                    "flex-grow pt-1 pb-6 transition-opacity duration-300",
                    isCompleted ? "opacity-50" : "opacity-100"
                  )}
                >
                  <p
                    className={cn(
                      "text-foreground leading-relaxed text-lg",
                      isCompleted && "line-through decoration-muted-foreground/30"
                    )}
                  >
                    {instruction}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Completion State */}
        {completedSteps.size === recipe.instructions.length && (
          <div className="mt-8 p-6 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center">
            <ChefHat className="w-12 h-12 text-emerald-500 dark:text-emerald-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mb-1">Bon Appétit!</h3>
            <p className="text-emerald-700 dark:text-emerald-300">You&apos;ve completed this recipe.</p>
          </div>
        )}
      </section>

      {/* Nutrition */}
      {recipe.nutrition && Object.keys(recipe.nutrition).length > 0 && (
        <section className="border-t pt-6">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            Nutrition per serving
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recipe.nutrition.calories !== undefined && (
              <div className="bg-card dark:bg-card p-4 rounded-lg shadow-sm border border-border flex flex-col">
                <span className="text-xs text-muted-foreground font-medium uppercase mb-1">Calories</span>
                <div className="flex items-end">
                  <span className="text-2xl font-bold text-foreground leading-none mr-1">
                    {Math.round(((recipe.nutrition.calories * scalingRatio) / currentServings) * recipe.servings)}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium pb-0.5">kcal</span>
                </div>
              </div>
            )}
            {recipe.nutrition.protein_g !== undefined && (
              <div className="bg-card dark:bg-card p-4 rounded-lg shadow-sm border border-border flex flex-col">
                <span className="text-xs text-muted-foreground font-medium uppercase mb-1 flex items-center">
                  <Beef className="w-3 h-3 mr-1 text-red-400" /> Protein
                </span>
                <div className="flex items-end">
                  <span className="text-2xl font-bold text-foreground leading-none mr-1">
                    {Math.round(((recipe.nutrition.protein_g * scalingRatio) / currentServings) * recipe.servings)}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium pb-0.5">g</span>
                </div>
              </div>
            )}
            {recipe.nutrition.carbs_g !== undefined && (
              <div className="bg-card dark:bg-card p-4 rounded-lg shadow-sm border border-border flex flex-col">
                <span className="text-xs text-muted-foreground font-medium uppercase mb-1 flex items-center">
                  <Wheat className="w-3 h-3 mr-1 text-amber-400" /> Carbs
                </span>
                <div className="flex items-end">
                  <span className="text-2xl font-bold text-foreground leading-none mr-1">
                    {Math.round(((recipe.nutrition.carbs_g * scalingRatio) / currentServings) * recipe.servings)}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium pb-0.5">g</span>
                </div>
              </div>
            )}
            {recipe.nutrition.fat_g !== undefined && (
              <div className="bg-card dark:bg-card p-4 rounded-lg shadow-sm border border-border flex flex-col">
                <span className="text-xs text-muted-foreground font-medium uppercase mb-1 flex items-center">
                  <Droplet className="w-3 h-3 mr-1 text-yellow-500" /> Fat
                </span>
                <div className="flex items-end">
                  <span className="text-2xl font-bold text-foreground leading-none mr-1">
                    {Math.round(((recipe.nutrition.fat_g * scalingRatio) / currentServings) * recipe.servings)}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium pb-0.5">g</span>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground/70 mt-4 text-center">
            Nutritional values are approximate and may differ from actual values.
          </p>
        </section>
      )}
    </article>
  );
}
