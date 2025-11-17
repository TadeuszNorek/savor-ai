import { useState, useEffect } from "react";
import { TextareaWithCounter } from "./TextareaWithCounter";
import { GenerateButton } from "./GenerateButton";
import { useGenerateRecipeMutation } from "@/lib/api/recipes";
import { useI18n } from "@/lib/contexts/I18nContext";
import type { GeneratorDraftVM, GenerateRecipeResponse, ApiError } from "@/types";

interface GeneratorPanelProps {
  onGenerated: (response: GenerateRecipeResponse) => void;
}

/**
 * GeneratorPanel component - AI recipe generation interface
 * Manages prompt input, generation request, and draft state
 */
export function GeneratorPanel({ onGenerated }: GeneratorPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const { lang, t } = useI18n();

  const generateMutation = useGenerateRecipeMutation();

  // Clear error when prompt changes
  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [prompt]);

  const handleGenerate = () => {
    if (!prompt.trim() || prompt.length < 1 || prompt.length > 2000) {
      return;
    }

    setError(null);
    generateMutation.mutate(
      { prompt: prompt.trim(), lang },
      {
        onSuccess: (response) => {
          // Save draft to sessionStorage
          const draft: GeneratorDraftVM = {
            prompt: prompt.trim(),
            recipe: response.recipe,
            generationId: response.generation_id,
            generatedAt: response.generated_at,
          };
          sessionStorage.setItem("generatorDraft", JSON.stringify(draft));

          // Notify parent
          onGenerated(response);
        },
        onError: (err) => {
          setError(err as ApiError);
        },
      }
    );
  };

  const handleRetry = () => {
    handleGenerate();
  };

  const isPromptValid = prompt.trim().length >= 1 && prompt.trim().length <= 2000;
  const isDisabled = !isPromptValid || generateMutation.isPending;

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{t('generator.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('generator.description')}</p>
      </div>

      <TextareaWithCounter
        value={prompt}
        onChange={setPrompt}
        disabled={generateMutation.isPending}
        maxLength={2000}
        placeholder={t('generator.placeholder')}
      />

      <GenerateButton
        onClick={handleGenerate}
        disabled={isDisabled}
        loading={generateMutation.isPending}
        error={error}
        onRetry={handleRetry}
      />

      {/* Info section */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold mb-2">{t('generator.tipsTitle')}</h3>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>{t('generator.tip1')}</li>
          <li>{t('generator.tip2')}</li>
          <li>{t('generator.tip3')}</li>
        </ul>
      </div>
    </div>
  );
}
