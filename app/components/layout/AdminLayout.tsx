export function AdminLayout({ children }: { children: React.ReactNode }) {
  // AdminLayout has been simplified because the full layout is now
  // handled inside `app/routes/admin.tsx`. This avoids the nested 
  // duplicate sidebar/header that was causing overlapping UI issues.
  return <div className="admin-root-wrapper">{children}</div>;
}
