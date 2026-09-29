'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const messages: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The sign-in link is no longer valid.',
  Default: 'An authentication error occurred.',
};

export default function AuthErrorPage() {
  const params = useSearchParams();
  const errorKey = params.get('error') ?? 'Default';
  const message = messages[errorKey] ?? messages.Default;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-4 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 text-2xl">
            ✕
          </span>
        </div>
        <h1 className="text-xl font-semibold text-slate-900">Authentication Error</h1>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
        <Link
          href="/auth/login"
          className="mt-6 inline-block rounded-lg bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
