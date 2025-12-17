import Link from "next/link";

export default function CommsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">Communications</div>
          <div className="text-sm text-muted-foreground">Email + SMS • inbound + outbound • multi-tenant</div>
        </div>
        <nav className="flex gap-4 text-sm">
          <Link className="underline" href="/comms/inbox">Inbox</Link>
          <Link className="underline" href="/comms/templates">Templates</Link>
          <Link className="underline" href="/comms/sequences">Sequences</Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
