"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/useAuthStore";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    
    if (!accessToken) {
      router.replace("/login");
      return;
    }

    // Temporarily set access token so getMyProfile can fetch user
    useAuthStore.setState({ accessToken, refreshToken: refreshToken || undefined });

    (async () => {
      try {
        const user = await authApi.getMyProfile();
        useAuthStore.getState().setAuth(accessToken, refreshToken || "", user);
        const nextPath = searchParams.get("next");
        router.replace(nextPath?.startsWith("/") ? nextPath : "/dashboard");
      } catch {
        router.replace("/login");
      }
    })();
  }, [router, searchParams]);

  return <div>Đang xử lý đăng nhập...</div>;
}
