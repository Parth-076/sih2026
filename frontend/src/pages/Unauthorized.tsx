import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="flex h-full min-h-screen flex-col items-center justify-center p-8 text-center">
      <ShieldAlert className="mb-3 h-10 w-10 text-warning" />
      <h1 className="text-lg font-semibold text-navy-800">Access restricted</h1>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Your role doesn't have permission to view this page. If you believe this is a mistake,
        contact an administrator.
      </p>
      <Link to="/dashboard" className="mt-4 text-sm font-medium text-teal-700 hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
