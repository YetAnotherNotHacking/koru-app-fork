"use client";
import { createUser } from "api-client";

import { useState } from "react";

function ClientPing() {
  const [message, setMessage] = useState("");

  return (
    <>
      <button
        className="bg-blue-500 text-white p-2 rounded"
        onClick={async () => {
          const { data, error } = await createUser({
            body: { email: "123", name: "321" },
          });
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
