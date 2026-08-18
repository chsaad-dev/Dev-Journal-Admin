"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Verify admin status
      const userDocRef = doc(db, "users", userCredential.user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists() && userDocSnap.data()?.role === "admin") {
        router.push("/dashboard");
      } else {
        await auth.signOut();
        setError("Access denied: Admin role required.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background font-sans p-4">
      <div className="w-full max-w-md bg-surface-container border border-outline-variant rounded-[var(--radius-card)] p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold font-mono text-tertiary mb-2">DevJournal Admin</h1>
          <p className="text-on-surface-variant">Sign in to manage content</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary-container transition-colors"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary-container transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 rounded bg-error-container border border-error-container text-error text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-container hover:bg-[#4338ca] text-on-surface font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
