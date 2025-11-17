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
  // Get current language from i18n context
  const { lang } = useI18n();

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
        toast.success("Profile created successfully!");
        // Query cache will be invalidated automatically, causing re-render with updated data
      } else {
        const command = formValuesToUpdateCommand(values, initialValues);
        console.log("[ProfileView] Updating profile with command:", command);
        console.log("[ProfileView] Current values:", values);
        console.log("[ProfileView] Initial values:", initialValues);

        // Check if there are any changes
        if (Object.keys(command).length === 0) {
          toast.info("No changes to save");
          return;
        }

        await updateMutation.mutateAsync(command);
        toast.success("Profile updated successfully!");
        // Query cache will be invalidated automatically, causing re-render with updated data
      }
    } catch (err) {
      const apiError = err as ApiError;

      // Handle conflict (409) - profile already exists when trying to create
      if (apiError.error === "Conflict") {
        toast.error("Profile already exists. Please refresh the page.");
        // Query will be invalidated automatically
        return;
      }

      // Handle validation errors (400)
      if (apiError.error === "Bad Request" || apiError.message === "Validation failed") {
        toast.error(apiError.message || "Validation error. Please check your input.");
        return;
      }

      // Handle other errors
      toast.error(apiError.message || "An error occurred. Please try again.");
    }
  };

  // Show error state for non-404 errors
  if (error && (error as ApiError).error !== "Not Found") {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {(error as ApiError).message || "Failed to load profile. Please try again."}
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
          <AlertTitle>Create Your Profile</AlertTitle>
          <AlertDescription>
            Set up your dietary preferences to get personalized recipe recommendations.
          </AlertDescription>
        </Alert>
      )}

      <ProfileForm initialValues={initialValues} mode={mode} onSubmit={handleSubmit} />

      {isSubmitting && <div className="text-sm text-muted-foreground">Saving...</div>}
    </div>
  );
}
