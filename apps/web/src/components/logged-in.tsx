"use client";

import useAuthStore from "@/stores/auth.store";
import { useMutation } from "@tanstack/react-query";
import { passwordLoginMutation } from "api-client/react-query";
import { jwtDecode } from "jwt-decode";
import { useState } from "react";

export default function LoggedIn() {
  const { setToken, clearToken, token } = useAuthStore();
  const { mutateAsync: login, isPending } = useMutation(
    passwordLoginMutation()
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const decodedToken = token ? jwtDecode(token) : null;

  async function handleLogin(username: string, password: string) {
    const response = await login({ body: { username, password } });
    setToken(response.access_token);
  }

  return (
    <div>
      {!token ? (
        <>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={() => handleLogin(username, password)}
            className="bg-blue-500 text-white p-2 rounded"
          >
            {isPending ? "Logging in..." : "Log in"}
          </button>
        </>
      ) : (
        <>
          <p>Logged in as {decodedToken?.sub}</p>
          <button
            className="bg-red-500 text-white p-2 rounded"
            onClick={() => clearToken()}
          >
            Log out
          </button>
        </>
      )}
    </div>
  );
}
