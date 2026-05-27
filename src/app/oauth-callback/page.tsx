"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/useAuthStore";

export default function OAuthCallbackPage() {
  const router = useRouter();

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
        router.replace("/dashboard");
      } catch (err) {
        router.replace("/login");
      }
    })();
  }, [router]);

  return <div>Đang xử lý đăng nhập...</div>;
}
