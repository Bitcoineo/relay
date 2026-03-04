// ─── Shortcode → Unicode map ─────────────────────────────────────────

export const EMOJI_SHORTCODES: Record<string, string> = {
  thumbsup: "👍",
  thumbsdown: "👎",
  heart: "❤️",
  smile: "😊",
  laugh: "😂",
  joy: "😂",
  grin: "😁",
  wink: "😉",
  blush: "😊",
  thinking: "🤔",
  clap: "👏",
  fire: "🔥",
  rocket: "🚀",
  tada: "🎉",
  party: "🎉",
  wave: "👋",
  ok: "👌",
  pray: "🙏",
  muscle: "💪",
  eyes: "👀",
  cry: "😢",
  sob: "😭",
  angry: "😠",
  surprised: "😮",
  wow: "😮",
  cool: "😎",
  sweat: "😅",
  confused: "😕",
  star: "⭐",
  sparkles: "✨",
  check: "✅",
  x: "❌",
  warning: "⚠️",
  bug: "🐛",
  bulb: "💡",
  memo: "📝",
  pin: "📌",
  link: "🔗",
  lock: "🔒",
  key: "🔑",
  mail: "📧",
  bell: "🔔",
  clock: "🕐",
  coffee: "☕",
  pizza: "🍕",
  beer: "🍺",
  hundred: "💯",
  skull: "💀",
  ghost: "👻",
  poop: "💩",
};

/** Replace :shortcode: patterns with unicode emoji */
export function replaceShortcodes(content: string): string {
  return content.replace(/:(\w+):/g, (match, code: string) => {
    return EMOJI_SHORTCODES[code.toLowerCase()] || match;
  });
}

// ─── Emoji categories for picker ────────────────────────────────────

export const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
  {
    name: "Smileys",
    emojis: [
      "😀", "😃", "😄", "😁", "😊", "😇", "🙂", "😉", "😍", "🥰",
      "😘", "😂", "🤣", "😅", "😆", "😎", "🤩", "🥳", "😏", "😒",
      "😕", "😟", "🙁", "😮", "😯", "😲", "😳", "🥺", "😢", "😭",
      "😤", "😠", "😡", "🤬", "😈", "👿", "💀", "👻", "🤖", "😺",
    ],
  },
  {
    name: "Gestures",
    emojis: [
      "👍", "👎", "👏", "🙌", "🤝", "👋", "✌️", "🤞", "🤟", "🤘",
      "👌", "🤌", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️",
      "💪", "🙏", "🫡", "🫶", "✍️", "💅",
    ],
  },
  {
    name: "Hearts",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟",
    ],
  },
  {
    name: "Objects",
    emojis: [
      "🔥", "✨", "⭐", "🌟", "💫", "🎉", "🎊", "🎈", "🏆", "🥇",
      "🎯", "💡", "📌", "📎", "🔗", "🔒", "🔑", "🔔", "📧", "💬",
      "💭", "🗯️", "📝", "📚", "💻", "🖥️", "📱", "⌨️", "🖱️", "🕐",
      "⏰", "☕", "🍕", "🍔", "🍺", "🍷", "🎵", "🎶", "✅", "❌",
      "⚠️", "💯", "🚀", "🐛",
    ],
  },
  {
    name: "Animals",
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
      "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🦅", "🦆",
      "🦉", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐙", "🐠", "🐳",
    ],
  },
];

/** Quick reactions shown in message action bar */
export const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "👀", "🔥"];
