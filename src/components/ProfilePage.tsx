import QueryProvider from "./QueryProvider";
import ProfileView from "./ProfileView";
import { Toaster } from "./ui/sonner";

/**
 * ProfilePage Component
 *
 * Client-side only wrapper for the profile view.
 * Combines QueryProvider, ProfileView, and Toaster into a single island.
 *
 * @component
 */
export default function ProfilePage() {
  return (
    <QueryProvider>
      <ProfileView />
      <Toaster />
    </QueryProvider>
  );
}
