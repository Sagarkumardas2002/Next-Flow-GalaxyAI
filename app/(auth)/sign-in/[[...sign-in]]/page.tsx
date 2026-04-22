

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 px-4">
      <div className="absolute w-72 h-72 bg-purple-500 rounded-full blur-3xl opacity-20 top-10 left-10"></div>
      <div className="absolute w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-20 bottom-10 right-10"></div>

      <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-6 sm:p-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">Welcome Back 👋</h1>
          <p className="text-yellow-400 text-sm mt-1">Sign in to continue</p>
        </div>
        <SignIn
          routing="path"
          path="/sign-in"
          forceRedirectUrl="/dashboard"
          appearance={{
            elements: {
              card: "shadow-none bg-transparent",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              formButtonPrimary: "bg-blue-600 hover:bg-blue-700 transition-all",
            },
          }}
        />
      </div>
    </div>
  );
}
