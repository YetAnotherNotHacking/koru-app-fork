"use client";
import { ping } from "api-client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

function ClientPing() {
  const [message, setMessage] = useState("");
  const [isPinging, setIsPinging] = useState(false);

  const handlePing = async () => {
    setIsPinging(true);
    try {
      const { data, error } = await ping();
      if (data) {
        setMessage(data.message);
      } else if (error) {
        setMessage(JSON.stringify(error));
      }
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/20"
        onClick={handlePing}
        disabled={isPinging}
      >
        {isPinging ? "Pinging..." : "Client side ping"}
      </Button>

      {message && (
        <div className="mt-3 text-cyan-400 font-medium">{message}</div>
      )}
    </div>
  );
}

export default ClientPing;
