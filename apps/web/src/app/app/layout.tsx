import AuthCheck from "@/components/auth/AuthCheck";
import Header from "@/components/layout/AppHeader";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthCheck>
      <Header />
      <main>{children}</main>
    </AuthCheck>
  );
}
