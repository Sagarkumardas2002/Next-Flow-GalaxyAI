
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const user = await currentUser();

  // ✅ AUTO REDIRECT if already logged in
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 px-4">
      <div className="absolute w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-20 top-10 left-10"></div>
      <div className="absolute w-80 h-80 bg-purple-500 rounded-full blur-3xl opacity-20 bottom-10 right-10"></div>

      <div className="relative z-10 text-center max-w-xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-white">
          Build Smarter with <span className="text-blue-400">Next.js</span>
        </h1>

        <p className="text-gray-300 mt-4">A simple, fast and modern starter</p>

        <div className="mt-8">
          <Link
            href="/sign-in"
            className="px-6 py-3 bg-blue-600 rounded-xl text-white"
          >
            Get Started →
          </Link>
        </div>
      </div>
    </main>
  );
}
