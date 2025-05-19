"use client";

import useAuthStore from "@/stores/auth.store";
import { useMutation } from "@tanstack/react-query";
import {
  passwordLoginMutation,
  registerMutation,
} from "api-client/react-query";
import { jwtDecode } from "jwt-decode";
import { useState } from "react";

export default function LoggedIn() {
  const { updateToken, logOut, token } = useAuthStore();
  const {
    mutateAsync: login,
    isPending: isLoginPending,
    isError: isLoginError,
  } = useMutation(passwordLoginMutation());
  const {
    mutateAsync: register,
    isPending: isRegisterPending,
    isError: isRegisterError,
  } = useMutation(registerMutation());
  const [usernameLogin, setUsernameLogin] = useState("");
  const [passwordLogin, setPasswordLogin] = useState("");

  const [nameRegister, setNameRegister] = useState("");
  const [emailRegister, setEmailRegister] = useState("");
  const [passwordRegister, setPasswordRegister] = useState("");

  const decodedToken = token ? jwtDecode(token) : null;

  async function handleLogin(username: string, password: string) {
    try {
      const response = await login({ body: { username, password } });
      updateToken(response.access_token);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleRegister(name: string, email: string, password: string) {
    try {
      const response = await register({
        body: {
          first_name: name.split(" ")[0],
          last_name: name.split(" ").slice(1).join(" "),
          email,
          password,
        },
      });
      updateToken(response.access_token);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div>
      {!token ? (
        <>
          <div>
            <p>Login</p>
            <input
              className={`border-2 rounded-md p-2 ${
                isLoginError ? "border-red-500" : "border-gray-300"
              }`}
              type="text"
              placeholder="Username"
              value={usernameLogin}
              onChange={(e) => setUsernameLogin(e.target.value)}
            />
            <input
              className={`border-2 rounded-md p-2 ${
                isLoginError ? "border-red-500" : "border-gray-300"
              }`}
              type="password"
              placeholder="Password"
              value={passwordLogin}
              onChange={(e) => setPasswordLogin(e.target.value)}
            />
            <button
              onClick={() => handleLogin(usernameLogin, passwordLogin)}
              className="bg-blue-500 text-white p-2 rounded"
            >
              {isLoginPending ? "Logging in..." : "Log in"}
            </button>
            {isLoginError && (
              <p className="text-red-500">Invalid credentials</p>
            )}
          </div>
          <div>
            <p>Register</p>
            <input
              className={`border-2 rounded-md p-2 ${
                isRegisterError ? "border-red-500" : "border-gray-300"
              }`}
              type="text"
              placeholder="Name"
              value={nameRegister}
              onChange={(e) => setNameRegister(e.target.value)}
            />
            <input
              className={`border-2 rounded-md p-2 ${
                isRegisterError ? "border-red-500" : "border-gray-300"
              }`}
              type="text"
              placeholder="Email"
              value={emailRegister}
              onChange={(e) => setEmailRegister(e.target.value)}
            />
            <input
              className={`border-2 rounded-md p-2 ${
                isLoginError ? "border-red-500" : "border-gray-300"
              }`}
              type="password"
              placeholder="Password"
              value={passwordRegister}
              onChange={(e) => setPasswordRegister(e.target.value)}
            />
            <button
              onClick={() =>
                handleRegister(nameRegister, emailRegister, passwordRegister)
              }
              className="bg-blue-500 text-white p-2 rounded"
            >
              {isRegisterPending ? "Registering..." : "Register"}
            </button>
            {isRegisterError && (
              <p className="text-red-500">Invalid credentials</p>
            )}
          </div>
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
