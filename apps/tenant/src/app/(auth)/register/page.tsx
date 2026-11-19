import { RegisterPage } from "@/features/auth/register-page";
import { PlatformStatusNotice } from "@/features/shop/announcement-bar";

export default function Page() {
  return (
    <>
      <PlatformStatusNotice forSignup />
      <RegisterPage />
    </>
  );
}
