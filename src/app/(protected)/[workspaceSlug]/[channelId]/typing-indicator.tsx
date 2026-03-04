interface TypingIndicatorProps {
  typingUsers: Map<string, { userName: string; timeout: NodeJS.Timeout }>;
}

export default function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  const typingNames = Array.from(typingUsers.values()).map((t) => t.userName);

  let typingText = "";
  if (typingNames.length === 1) {
    typingText = `${typingNames[0]} is typing`;
  } else if (typingNames.length === 2) {
    typingText = `${typingNames[0]} and ${typingNames[1]} are typing`;
  } else if (typingNames.length > 2) {
    typingText = "Several people are typing";
  }

  return (
    <div className="flex h-6 items-center bg-white px-4 sm:px-6">
      {typingNames.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-[#A3A3A3]">
          <span className="flex items-center gap-0.5">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </span>
          <span>{typingText}</span>
        </div>
      )}
    </div>
  );
}
