import { Sidebar } from "@/components/dashboard/Sidebar";

// The persistent frame: sidebar on the left (a top scroller on mobile) and the
// section content filling the rest of the viewport. Lives inside DashboardProvider
// so the sidebar can read the shared context.
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface lg:flex">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-8 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
