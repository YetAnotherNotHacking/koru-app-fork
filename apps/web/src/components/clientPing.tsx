"use client";
import { ping } from "api-client";
import { useState } from "react";

function ClientPing() {
  const [message, setMessage] = useState("");

  return (
    <>
      <button
        className="bg-blue-500 text-white p-2 rounded"
        onClick={async () => {
          const { data, error } = await ping();
          if (data) {
            setMessage(data.message);
          } else if (error) {
            setMessage(String(error));
          }
        }}
      >
        Client side ping
      </button>
      {message && "Message: " + message}
    </>
  );
}

export default ClientPing;
