import { Button, Html } from "@react-email/components";
import { z } from "zod";
import { registerEmail } from "../email-registry";

const type = "my-email";

const schema = z.object({
  name: z.string(),
  email: z.string().email(),
  message: z.string(),
});

export default function MyEmail({
  name,
  email,
  message,
}: z.infer<typeof schema>) {
  return (
    <Html>
      <Button
        href="https://example.com"
        style={{ background: "#000", color: "#fff", padding: "12px 20px" }}
      >
        Click me
      </Button>
    </Html>
  );
}

registerEmail(type, schema, MyEmail);
