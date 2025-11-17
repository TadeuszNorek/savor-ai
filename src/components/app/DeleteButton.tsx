import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useI18n } from "@/lib/contexts/I18nContext";

interface DeleteButtonProps {
  recipeId: string;
  recipeName: string;
  onDeleted: (id: string) => void;
  loading?: boolean;
}

/**
 * DeleteButton component - deletes saved recipe with confirmation dialog
 * Shows AlertDialog before permanent deletion
 */
export function DeleteButton({ recipeId, recipeName, onDeleted, loading = false }: DeleteButtonProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onDeleted(recipeId);
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="lg" className="gap-2" disabled={loading}>
          <Trash2 className="h-5 w-5" />
          {t('recipeList.deleteRecipe')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('recipeList.deleteConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('recipeList.deleteConfirmDesc', { name: recipeName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t('recipeList.deleteConfirmButton')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
