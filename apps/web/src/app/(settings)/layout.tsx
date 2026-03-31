import { getUserProfile } from "@/features/settings/services/userAction";
import { SettingsSidebar } from "@/features/settings/components/SettingsSidebar";
import { redirect } from "next/navigation";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let profile;
  try {
    profile = await getUserProfile();
  } catch (e) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-4 bg-background md:flex-row md:gap-0">
      <SettingsSidebar userRole={profile?.role || "USER"} />
      <main className="flex-1 overflow-y-auto md:p-8">
        <div className="app-shell-panel mx-auto min-h-full max-w-4xl rounded-[24px] border border-border/50 bg-surface p-5 shadow-sm md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
