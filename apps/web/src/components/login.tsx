"use client";

import useAuthStore from "@/stores/auth.store";
import { useMutation } from "@tanstack/react-query";
import { passwordLoginMutation } from "api-client/react-query";
import { jwtDecode } from "jwt-decode";
import { useState } from "react";

export default function LoggedIn() {
  const { updateToken, logOut, token } = useAuthStore();
  const {
    mutateAsync: login,
    isPending,
    isError,
  } = useMutation(passwordLoginMutation());
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const decodedToken = token ? jwtDecode(token) : null;

  async function handleLogin(username: string, password: string) {
    try {
      const response = await login({ body: { username, password } });
      updateToken(response.access_token);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div>
      {!token ? (
        <>
          <input
            className={`border-2 rounded-md p-2 ${
              isError ? "border-red-500" : "border-gray-300"
            }`}
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className={`border-2 rounded-md p-2 ${
              isError ? "border-red-500" : "border-gray-300"
            }`}
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
          {isError && <p className="text-red-500">Invalid credentials</p>}
        </>
      ) : (
        <>
          <p>Logged in as {decodedToken?.sub}</p>
          <button
            className="bg-red-500 text-white p-2 rounded"
            onClick={() => logOut()}
          >
            Log out
          </button>
        </>
      )}
    </div>
  );
}
