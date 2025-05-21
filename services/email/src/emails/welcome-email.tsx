import { Button, Html, Text, Heading } from "@react-email/components";
import { z } from "zod";
import { registerEmail } from "../email-registry";

const type = "welcome-email";

const schema = z.object({
  username: z.string(),
  verificationLink: z.string().url(),
});

export default function WelcomeEmail({
  username,
  verificationLink,
}: z.infer<typeof schema>) {
  return (
    <Html>
      <Heading as="h1">Welcome {username}!</Heading>
      <Text>Thank you for signing up. Please verify your email address.</Text>
      <Button
        href={verificationLink}
        style={{ background: "#000", color: "#fff", padding: "12px 20px" }}
      >
        Verify Email
      </Button>
    </Html>
  );
}

registerEmail(type, schema, WelcomeEmail);
