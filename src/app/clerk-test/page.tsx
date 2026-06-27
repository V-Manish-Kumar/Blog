import { auth, currentUser } from "@clerk/nextjs/server";
import { syncUser } from "@/lib/auth-sync";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  User as UserIcon, 
  Database, 
  LogIn,
  Key,
  Lock,
  ArrowRight,
  ExternalLink
} from "lucide-react";

export default async function ClerkTestPage() {
  // 1. Fetch Clerk credentials (keys presence check)
  const isPublishableKeySet = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isSecretKeySet = !!process.env.CLERK_SECRET_KEY;

  // 2. Fetch Auth context
  const { userId, sessionClaims } = await auth();
  const user = userId ? await currentUser() : null;
  
  // 3. Trigger & check local DB sync status
  let dbUser = null;
  let syncError = null;
  if (userId) {
    try {
      dbUser = await syncUser();
    } catch (e: any) {
      syncError = e.message || "Failed to sync user to local SQLite database";
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* Header */}
          <div className="border-b pb-4 border-slate-200/60 dark:border-zinc-800/80">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-zinc-50 font-sans flex items-center gap-2">
              <Shield className="h-8 w-8 text-indigo-500" />
              Clerk Auth Diagnostic Panel
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
              Check live authentication variables, session states, and test route access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Column 1: Config Status */}
            <div className="bg-white dark:bg-zinc-900/60 border dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Key className="h-4 w-4" /> Environment Config
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Publishable Key</span>
                  {isPublishableKeySet ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-500 font-medium">
                      <CheckCircle className="h-4 w-4" /> Configured
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-500 font-medium">
                      <AlertTriangle className="h-4 w-4" /> Missing
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Secret Key</span>
                  {isSecretKeySet ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-500 font-medium">
                      <CheckCircle className="h-4 w-4" /> Configured
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-500 font-medium">
                      <AlertTriangle className="h-4 w-4" /> Missing
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Column 2: Authentication Status */}
            <div className="bg-white dark:bg-zinc-900/60 border dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <LogIn className="h-4 w-4" /> Clerk Session
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Session Status</span>
                  {userId ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-500 font-medium">
                      <CheckCircle className="h-4 w-4" /> Signed In
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-500 font-medium">
                      <AlertTriangle className="h-4 w-4" /> Signed Out
                    </span>
                  )}
                </div>
                {userId && (
                  <div className="text-xs font-mono bg-slate-50 dark:bg-zinc-950 p-2 rounded break-all border dark:border-zinc-800">
                    ID: {userId}
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Database Sync Status */}
            <div className="bg-white dark:bg-zinc-900/60 border dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Database className="h-4 w-4" /> SQLite DB Sync
              </h2>
              <div className="space-y-3">
                {userId ? (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span>Sync Status</span>
                      {dbUser ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-500 font-medium">
                          <CheckCircle className="h-4 w-4" /> Synced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-500 font-medium">
                          <AlertTriangle className="h-4 w-4" /> Sync Failed
                        </span>
                      )}
                    </div>
                    {dbUser && (
                      <div className="flex items-center justify-between text-sm pt-1">
                        <span>Database Role</span>
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {dbUser.role}
                        </span>
                      </div>
                    )}
                    {syncError && (
                      <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-2 rounded border border-rose-100 dark:border-rose-900/30">
                        {syncError}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Please Sign In first to test database profile sync.
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* User Profile Details */}
          {userId && user && (
            <div className="bg-white dark:bg-zinc-900/60 border dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2 font-sans">
                <UserIcon className="h-5 w-5 text-indigo-500" />
                Active Clerk Profile Info
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-1">
                  <div className="text-xs text-slate-400">Name</div>
                  <div className="font-semibold text-slate-900 dark:text-zinc-100">{user.firstName} {user.lastName || ""}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-400">Email</div>
                  <div className="font-semibold text-slate-900 dark:text-zinc-100">{user.emailAddresses[0]?.emailAddress}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-400">Clerk Public Metadata Role</div>
                  <div className="font-semibold font-mono text-indigo-600 dark:text-indigo-400">
                    {(user.publicMetadata?.role as string) || "Not configured (Default: viewer)"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-400">JWT Token Claims metadata</div>
                  <pre className="text-xs font-mono bg-slate-50 dark:bg-zinc-950 p-3 rounded border dark:border-zinc-800 max-h-24 overflow-auto">
                    {JSON.stringify(sessionClaims?.metadata || "No metadata claim", null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Route Access Authorization Tests */}
          <div className="bg-white dark:bg-zinc-900/60 border dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2 font-sans">
              <Lock className="h-5 w-5 text-indigo-500" />
              Role-Based Access Control (RBAC) Route Testing
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              Click these protected links to test if Clerk and the middleware redirect/authorise you properly:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              
              {/* Test Page 1: Admin */}
              <Link
                href="/admin"
                className="group flex flex-col justify-between border dark:border-zinc-800 p-4 rounded-lg bg-slate-50 dark:bg-zinc-900/20 hover:bg-slate-100 dark:hover:bg-zinc-900/40 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wide">Admin Role Route</div>
                  <div className="text-base font-semibold text-slate-800 dark:text-zinc-200 mt-1 flex items-center gap-1">
                    /admin
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-normal">
                    Requires Admin role. Non-admins will be redirected to the Home page.
                  </p>
                </div>
                <span className="text-indigo-500 text-xs font-semibold inline-flex items-center gap-0.5 mt-4 group-hover:translate-x-1 transition-transform">
                  Test Route <ArrowRight className="h-3 w-3" />
                </span>
              </Link>

              {/* Test Page 2: Write */}
              <Link
                href="/write"
                className="group flex flex-col justify-between border dark:border-zinc-800 p-4 rounded-lg bg-slate-50 dark:bg-zinc-900/20 hover:bg-slate-100 dark:hover:bg-zinc-900/40 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wide">Writer Role Route</div>
                  <div className="text-base font-semibold text-slate-800 dark:text-zinc-200 mt-1 flex items-center gap-1">
                    /write
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-normal">
                    Requires Writer or Admin role. Unauthorised users redirected to Home page.
                  </p>
                </div>
                <span className="text-indigo-500 text-xs font-semibold inline-flex items-center gap-0.5 mt-4 group-hover:translate-x-1 transition-transform">
                  Test Route <ArrowRight className="h-3 w-3" />
                </span>
              </Link>

              {/* Test Page 3: Bookmarks */}
              <Link
                href="/bookmarks"
                className="group flex flex-col justify-between border dark:border-zinc-800 p-4 rounded-lg bg-slate-50 dark:bg-zinc-900/20 hover:bg-slate-100 dark:hover:bg-zinc-900/40 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wide">Authenticated User Route</div>
                  <div className="text-base font-semibold text-slate-800 dark:text-zinc-200 mt-1 flex items-center gap-1">
                    /bookmarks
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-normal">
                    Requires any logged-in user. Unauthenticated users redirected to Sign In page.
                  </p>
                </div>
                <span className="text-indigo-500 text-xs font-semibold inline-flex items-center gap-0.5 mt-4 group-hover:translate-x-1 transition-transform">
                  Test Route <ArrowRight className="h-3 w-3" />
                </span>
              </Link>

            </div>
          </div>

          {/* Quick Troubleshooting Guide */}
          <div className="bg-slate-50 dark:bg-zinc-900/20 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-1.5 font-sans">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Authentication Troubleshooting Checklist
            </h2>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-zinc-400 list-disc list-inside leading-relaxed">
              <li>
                <strong>Turnstile CAPTCHA (Error 600010) failing:</strong> Go to the <a href="https://dashboard.clerk.com" target="_blank" className="text-indigo-500 hover:underline inline-flex items-center gap-0.5 font-medium">Clerk Dashboard <ExternalLink className="h-3 w-3" /></a> &rarr; <strong>User & Authentication</strong> &rarr; <strong>Attack Protection</strong>, and toggle <strong>Bot sign-up protection</strong> to <strong>OFF</strong> for this test instance.
              </li>
              <li>
                <strong>Role Metadata not showing in JWT Claims:</strong> By default, Clerk user metadata is only returned on backend API requests and isn't embedded in user session claims. Go to your <strong>Clerk Dashboard</strong> &rarr; <strong>Sessions</strong> &rarr; <strong>Customize Session Token</strong>, and edit the claims JSON to:
                <pre className="mt-1.5 p-2 bg-slate-100 dark:bg-zinc-950 rounded font-mono text-xs text-indigo-600 dark:text-indigo-400">{"{\n  \"metadata\": \"{{user.publicMetadata}}\"\n}"}</pre>
              </li>
              <li>
                <strong>Local Sync Errors:</strong> Ensure your SQLite database has been initialized with <code className="font-mono bg-slate-100 dark:bg-zinc-950 p-0.5 rounded text-rose-500">npx prisma db push</code>. If it fails to sync user names, make sure your first/last name properties are filled out in the test account.
              </li>
            </ul>
          </div>

        </div>
      </main>
    </div>
  );
}
