

import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

export default async function DashboardPage() {
  const user = await currentUser();

  const displayName =
    user?.firstName ||
    user?.fullName ||
    user?.emailAddresses[0]?.emailAddress ||
    "User";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="w-full flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h2 className="text-lg font-semibold">Dashboard</h2>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-300 hidden sm:block">
            {displayName}
          </span>

          {user?.imageUrl ? (
            <UserButton />
          ) : (
            <div className="flex items-center gap-2">
              <UserButton />
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                {user?.firstName?.[0] ||
                  user?.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() ||
                  "U"}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex items-center justify-center h-[85vh]">
        <h1 className="text-3xl font-bold">👋 Welcome, {displayName}!</h1>
      </main>
    </div>
  );
}