import AuthCheck from "@/components/auth/AuthCheck";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthCheck redirectTo="/app" invert>
      {children}
    </AuthCheck>
  );
}
