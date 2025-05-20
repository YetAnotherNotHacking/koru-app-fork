"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

export default function AuthForm() {
  const router = useRouter();
  const { updateToken } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);

  const onSuccess = (token: string) => {
    updateToken(token);
    router.push("/");
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md z-10">
        <Card className="backdrop-blur-md bg-black/30 border-neutral-800 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {isLogin ? "Sign In" : "Register"}
            </CardTitle>
            <CardDescription className="text-center text-neutral-300">
              {isLogin
                ? "Enter your credentials to sign in to your account."
                : "Create a new account to get started."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLogin ? (
              <LoginForm onSuccess={onSuccess} />
            ) : (
              <RegisterForm onSuccess={onSuccess} />
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t border-neutral-800 pt-4">
            <Button
              variant="ghost"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-neutral-300 hover:text-white hover:bg-neutral-800"
            >
              {isLogin
                ? "Don't have an account? Register"
                : "Already have an account? Sign in"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
