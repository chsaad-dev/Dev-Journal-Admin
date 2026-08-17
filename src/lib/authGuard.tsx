"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAuthorized(false);
        router.replace("/login");
        return;
      }

      try {
        // Check if user is an admin by reading their role from Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data()?.role === "admin") {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          router.replace("/login"); // or a "forbidden" page
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setIsAuthorized(false);
        router.replace("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isAuthorized === null) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-background)]">
        <p className="text-[var(--color-foreground)]">Verifying admin access...</p>
      </div>
    );
  }

  if (isAuthorized === false) {
    return null; // The redirect will handle navigation
  }

  return <>{children}</>;
}
