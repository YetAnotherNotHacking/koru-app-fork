import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Button,
  Hr,
  Row,
  Column,
  Tailwind,
  Link,
  Img,
} from "@react-email/components";
import { Clock } from "lucide-react";
import { z } from "zod";
import { registerEmail } from "@/email-registry";
import tailwindConfig from "@/tailwind.config";

const type = "confirm-email";

const schema = z.object({
  name: z.string().nullable(),
  type: z.enum(["signup", "waitlist"]),
  confirmationLink: z.string().url(),
  expirationHours: z.number(),
});

export default function ConfirmEmail({
  name,
  type,
  confirmationLink,
  expirationHours = 24,
}: z.infer<typeof schema>) {
  return (
    <Html>
      <Head />
      <Preview>
        {type === "waitlist"
          ? "Confirm your email address for the Koru waitlist"
          : "Confirm your email address for Koru"}
      </Preview>
      <Tailwind config={tailwindConfig}>
        <Body className="bg-[#0D0D0D] m-auto p-5 font-sans">
          <Container className="mx-auto bg-[#121212] border border-[#333333] rounded-lg w-full max-w-[600px] overflow-hidden">
            {/* Header */}
            <Section className="p-6 bg-black border-b border-[#333333]">
              <Img
                src="https://koru.cash/logos/dark_flat.png"
                alt="Koru"
                width={100}
                height={100}
              />
            </Section>

            {/* Content */}
            <Section className="p-8">
              <Text className="text-2xl leading-8 font-bold text-white m-0 mb-6">
                Verify your email
              </Text>
              <Text className="text-base leading-6 text-[#D1D1D1] my-4">
                Hey
                {name && (
                  <span className="text-white font-semibold">{name}</span>
                )}
                ,
              </Text>
              <Text className="text-base leading-6 text-[#D1D1D1] my-4">
                {type === "waitlist"
                  ? "Thanks for joining the Koru waitlist! Please confirm your email address so we can keep you updated."
                  : "Thanks for joining Koru! Please confirm your email address to finish setting up your account."}
              </Text>

              {/* CTA Button */}
              <Section className="my-8 text-center">
                <Button
                  href={confirmationLink}
                  className="bg-[#6355FF] rounded-md text-white font-semibold text-base py-3 px-6 inline-block no-underline"
                >
                  Verify My Email
                </Button>
              </Section>

              {/* Expiration notice */}
              <Section className="my-6 p-4 bg-[#1A1A1A] border border-[#333333] rounded-md">
                <Row>
                  <Column className="align-middle w-6 pt-1">
                    <Clock size={20} color="#FFD700" strokeWidth={3} />
                  </Column>
                  <Column className="align-middle">
                    <Text className="text-sm leading-5 text-[#FFD700] m-0">
                      This verification link expires in{" "}
                      <span className="font-bold">{expirationHours} hours</span>
                    </Text>
                  </Column>
                </Row>
              </Section>

              <Text className="text-base leading-6 text-[#D1D1D1] my-4">
                If you didn't sign up for{" "}
                {type === "waitlist" ? "the waitlist" : "an account"}, you can
                safely ignore this email.
              </Text>

              <Hr className="border-[#333333] my-8" />

              {/* Fallback link */}
              <Text className="text-sm leading-5 text-[#AAAAAA] my-2">
                If the button doesn't work, paste this URL into your browser:
              </Text>
              <Link
                href={confirmationLink}
                className="text-xs leading-5 text-[#6355FF] break-all my-2 mb-6"
              >
                {confirmationLink}
              </Link>

              {/* Security note */}
              <Section className="mt-8 p-4 bg-[#1A1A1A] rounded-md border border-[#333333]">
                <Text className="text-xs leading-5 text-[#999999] m-0">
                  This is an automated message from Koru. Please do not reply to
                  this email. For security reasons, we'll never ask for your
                  password or personal information.
                </Text>
              </Section>
            </Section>

            {/* Footer */}
            <Section className="bg-black p-6 border-t border-[#333333] text-center">
              <Text className="text-xs leading-5 text-[#999999] m-0">
                © {new Date().getFullYear()} Koru. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

registerEmail(type, schema, ConfirmEmail);
