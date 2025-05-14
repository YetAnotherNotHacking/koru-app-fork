"use client";
import { ping } from "api-client/axios";
import { useState } from "react";

function ClientPing() {
  const [message, setMessage] = useState("");

  return (
    <>
      <button
        className="bg-blue-500 text-white p-2 rounded"
        onClick={async () => {
          setMessage((await ping()).message);
        }}
      >
        Client side ping
      </button>
      {message && "Message: " + message}
    </>
  );
}

export default ClientPing;
