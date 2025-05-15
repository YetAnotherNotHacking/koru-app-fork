"use client";

import useAuthStore from "@/stores/auth.store";
import React from "react";

export default function LoggedIn() {
  const { loggedIn, toggleLoggedIn } = useAuthStore();

  return (
    <div>
      <p>Currently you are {loggedIn ? "logged in" : "logged out"}</p>
      <button
        onClick={() => toggleLoggedIn()}
        className="bg-blue-500 text-white p-2 rounded"
      >
        {loggedIn ? "Log out" : "Log in"}
      </button>
    </div>
  );
}
