import AuthCheck from "@/components/auth/AuthCheck";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthCheck>{children}</AuthCheck>;
}
