interface ComingSoonProps {
  title: string;
  phaseNote: string;
}

/**
 * Used only for routes that are wired up (guarded by RBAC, present in nav)
 * but whose real implementation lands in a later phase per docs/BUILD_LOG.md.
 * This is intentionally explicit about what's missing rather than faking data.
 */
export default function ComingSoon({ title, phaseNote }: ComingSoonProps) {
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-navy-800">{title}</h1>
      <p className="mt-2 max-w-lg text-sm text-slate-500">{phaseNote}</p>
    </div>
  );
}
