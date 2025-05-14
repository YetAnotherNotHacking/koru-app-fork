"use client";
import { createUser } from "api-client/axios";

function CreateUser() {
  console.log(process.env.NEXT_PUBLIC_API_URL);

  return (
    <button
      onClick={() => {
        createUser({
          name: "John Doe",
          email: "john.doe@example.com",
        });
      }}
    >
      Create User
    </button>
  );
}

export default CreateUser;
