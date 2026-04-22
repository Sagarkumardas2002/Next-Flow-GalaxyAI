
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 px-4">
      <div className="absolute w-72 h-72 bg-pink-500 rounded-full blur-3xl opacity-20 top-10 right-10"></div>
      <div className="absolute w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-20 bottom-10 left-10"></div>

      <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-2 sm:p-7">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">Create Account 🚀</h1>
          <p className="text-yellow-400 text-sm mt-1">
            Join us and start your journey
          </p>
        </div>

        <SignUp
          forceRedirectUrl="/dashboard"
          appearance={{
            elements: {
              card: "shadow-none bg-transparent",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              formButtonPrimary: "bg-pink-600 hover:bg-pink-700 transition-all",
            },
          }}
        />
      </div>
    </div>
  );
}