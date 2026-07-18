import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

type AppShellProps = {
  children: React.ReactNode;
  title: string;
  userName?: string | null;
  userEmail?: string | null;
};

export function AppShell({ children, title, userName, userEmail }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} userName={userName} userEmail={userEmail} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
