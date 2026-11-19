import { LoginPage } from "@/features/auth/login-page";
import { PlatformStatusNotice } from "@/features/shop/announcement-bar";

export default function Page() {
  return (
    <>
      <PlatformStatusNotice />
      <LoginPage />
    </>
  );
}
