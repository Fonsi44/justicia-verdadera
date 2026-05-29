export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50">
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <h1 className="text-lg font-semibold text-white">JV</h1>
        </div>
        <nav className="p-4">{/* Navigation will go here */}</nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/50 px-6">
          <div>{/* Breadcrumbs */}</div>
          <div>{/* User menu */}</div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
