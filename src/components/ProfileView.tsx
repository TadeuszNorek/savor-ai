import { toast } from "sonner";
import { useProfileQuery, useCreateProfileMutation, useUpdateProfileMutation } from "../lib/api/profile";
import {
  profileDtoToFormValues,
  emptyProfileFormValues,
  formValuesToCreateCommand,
  formValuesToUpdateCommand,
  type ProfileFormValues,
  type ProfileOperation,
} from "../lib/mappers/profile";
import { ProfileForm } from "./ProfileForm";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertCircle } from "lucide-react";
import type { ApiError } from "../types";
import { useI18n } from "../lib/contexts/I18nContext";

/**
 * ProfileView Component
 *
 * Main view for managing user dietary preferences profile.
 * Handles both create and update modes based on profile existence.
 *
 * Features:
 * - Fetches existing profile from API
 * - Auto-determines create vs update mode
 * - Handles all API errors (401 redirects to /login)
 * - Shows loading states and error alerts
 * - Invalidates cache after successful mutations
 * - Toast notifications for user feedback
 * - Saves current language preference when creating profile
 *
 * @component
 */
export default function ProfileView() {
  // Get current language and translation function from i18n context
  const { lang, t } = useI18n();

  // Fetch existing profile
  const { data: profile, isLoading, error } = useProfileQuery();

  // Mutations
  const createMutation = useCreateProfileMutation();
  const updateMutation = useUpdateProfileMutation();

  // Determine mode and initial values based on profile data
  const mode: ProfileOperation = profile ? "update" : "create";
  const initialValues: ProfileFormValues = profile ? profileDtoToFormValues(profile) : emptyProfileFormValues();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  // Handle form submission
  const handleSubmit = async (values: ProfileFormValues) => {
    try {
      if (mode === "create") {
        const command = formValuesToCreateCommand(values, lang);
        console.log("[ProfileView] Creating profile with command:", command);
        await createMutation.mutateAsync(command);
        toast.success(t('profile.createSuccess'));
        // Query cache will be invalidated automatically, causing re-render with updated data
      } else {
        const command = formValuesToUpdateCommand(values, initialValues);
        console.log("[ProfileView] Updating profile with command:", command);
        console.log("[ProfileView] Current values:", values);
        console.log("[ProfileView] Initial values:", initialValues);

        // Check if there are any changes
        if (Object.keys(command).length === 0) {
          toast.info(t('profile.noChanges'));
          return;
        }

        await updateMutation.mutateAsync(command);
        toast.success(t('profile.updateSuccess'));
        // Query cache will be invalidated automatically, causing re-render with updated data
      }
    } catch (err) {
      const apiError = err as ApiError;

      // Handle conflict (409) - profile already exists when trying to create
      if (apiError.error === "Conflict") {
        toast.error(t('profile.alreadyExists'));
        // Query will be invalidated automatically
        return;
      }

      // Handle validation errors (400)
      if (apiError.error === "Bad Request" || apiError.message === "Validation failed") {
        toast.error(apiError.message || t('profile.validationError'));
        return;
      }

      // Handle other errors
      toast.error(apiError.message || t('profile.genericError'));
    }
  };

  // Show error state for non-404 errors
  if (error && (error as ApiError).error !== "Not Found") {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('profile.errorTitle')}</AlertTitle>
        <AlertDescription>
          {(error as ApiError).message || t('profile.loadError')}
        </AlertDescription>
      </Alert>
    );
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {mode === "create" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('profile.createAlertTitle')}</AlertTitle>
          <AlertDescription>
            {t('profile.createAlertDescription')}
          </AlertDescription>
        </Alert>
      )}

      <ProfileForm initialValues={initialValues} mode={mode} onSubmit={handleSubmit} />

      {isSubmitting && <div className="text-sm text-muted-foreground">{t('common.saving')}</div>}
    </div>
  );
}
