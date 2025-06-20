"use client";

import { LoadingSpinner } from "@/components/ui/Loading";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter();
  const { checkAuth } = useAuth();


  useEffect(() => {
    // Check if user is already authenticated
    const checkAuthentication = async () => {
      const isAuthenticated = await checkAuth();
      if (isAuthenticated) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    };

    checkAuthentication();
  }, [router, checkAuth]);

  // Return a loading state with our new component
  return <LoadingSpinner fullScreen size="medium" />;
}
