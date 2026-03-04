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

interface MentionEmailProps {
  mentionedByName: string;
  channelName: string;
  messageContent: string;
  viewUrl: string;
}

export default function MentionEmail({
  mentionedByName,
  channelName,
  messageContent,
  viewUrl,
}: MentionEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>New mention in Relay</Text>
          <Text style={paragraph}>
            <strong>{mentionedByName}</strong> mentioned you in{" "}
            <strong>#{channelName}</strong>
          </Text>
          <Section style={messageBox}>
            <Text style={messageText}>{messageContent}</Text>
          </Section>
          <Section style={buttonContainer}>
            <Button style={button} href={viewUrl}>
              View Message
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            You received this because you were @mentioned in a Relay channel.
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

const messageBox = {
  backgroundColor: "#F8F8F7",
  borderLeft: "3px solid #4F46E5",
  padding: "12px 16px",
  borderRadius: "4px",
  margin: "16px 0",
};

const messageText = {
  fontSize: "15px",
  color: "#4A4A4A",
  lineHeight: "22px",
  margin: "0",
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
