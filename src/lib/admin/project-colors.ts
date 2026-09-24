const projectColors = [
  { solid: "#7058d7", soft: "#f0edff", strong: "#5035ba" },
  { solid: "#377ecf", soft: "#eaf3ff", strong: "#245caa" },
  { solid: "#159b89", soft: "#e7f8f3", strong: "#087463" },
  { solid: "#ca8535", soft: "#fff4e4", strong: "#92591c" },
  { solid: "#c36184", soft: "#fff0f5", strong: "#9b3e61" },
  { solid: "#dc6e45", soft: "#fff0e9", strong: "#a84827" },
  { solid: "#5369c9", soft: "#eef0ff", strong: "#394aa5" },
  { solid: "#7a9d35", soft: "#f2f8e5", strong: "#55731e" },
  { solid: "#2e91aa", soft: "#e7f7fb", strong: "#176b83" },
  { solid: "#aa5cc2", soft: "#f7ecfb", strong: "#803b99" },
  { solid: "#bf6258", soft: "#fff0eb", strong: "#99443a" },
  { solid: "#8a8f48", soft: "#f6f6e9", strong: "#656b2f" },
] as const;

export function projectColor(id: string) {
  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return projectColors[hash % projectColors.length];
}
