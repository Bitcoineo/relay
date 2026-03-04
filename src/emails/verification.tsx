import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Button,
  Hr,
  Section,
} from "@react-email/components";

interface VerificationEmailProps {
  name: string;
  verifyUrl: string;
}

export default function VerificationEmail({
  name,
  verifyUrl,
}: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Welcome to Relay</Text>
          <Text style={paragraph}>Hi {name || "there"},</Text>
          <Text style={paragraph}>
            Please verify your email address to get started with Relay.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={verifyUrl}>
              Verify Email
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            This link expires in 24 hours. If you didn&apos;t create a Relay
            account, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#ffffff",
  fontFamily: "Arial, sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "480px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "bold" as const,
  color: "#2D2D2D",
  marginBottom: "24px",
};

const paragraph = {
  fontSize: "16px",
  color: "#2D2D2D",
  lineHeight: "24px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#4F46E5",
  color: "#ffffff",
  padding: "12px 32px",
  borderRadius: "6px",
  fontSize: "16px",
  fontWeight: "bold" as const,
  textDecoration: "none",
};

const hr = {
  borderColor: "#EEEEED",
  margin: "24px 0",
};

const footer = {
  fontSize: "14px",
  color: "#6B6B6B",
  lineHeight: "20px",
};
