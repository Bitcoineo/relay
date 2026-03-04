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

interface WelcomeEmailProps {
  name: string;
}

export default function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>You&apos;re all set!</Text>
          <Text style={paragraph}>
            Hi {name || "there"}, your email has been verified. Welcome to Relay!
          </Text>
          <Text style={paragraph}>
            Create or join a workspace to start chatting with your team.
          </Text>
          <Section style={buttonContainer}>
            <Button
              style={button}
              href={`${process.env.NEXT_PUBLIC_BASE_URL}/workspaces`}
            >
              Go to Relay
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>Relay — Real-time team chat</Text>
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
