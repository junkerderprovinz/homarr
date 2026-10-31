import type { MantineColor } from "@mantine/core";
import { Box, Tooltip, UnstyledButton } from "@mantine/core";

import { useSettings } from "@homarr/settings";
import type { TablerIcon } from "@homarr/ui";

export interface PingDotAction {
  label: string;
  onClick: () => void;
}

interface PingDotProps {
  icon: TablerIcon;
  color: MantineColor;
  tooltip: string;
  hint?: string;
  action?: PingDotAction;
}

export const PingDot = ({ color, tooltip, hint, action, ...props }: PingDotProps) => {
  const { pingIconsEnabled } = useSettings();

  const dot = pingIconsEnabled ? (
    <props.icon style={{ width: 12, height: 12 }} strokeWidth={4} color={color} />
  ) : (
    <Box
      bg={color}
      style={{
        borderRadius: "100%",
      }}
      w={10}
      h={10}
    ></Box>
  );
  const label = hint ? (
    <>
      {tooltip}
      <br />
      {hint}
    </>
  ) : (
    tooltip
  );

  if (!action) {
    return (
      <Box bottom={10} right={10} pos="absolute" display={"flex"}>
        <Tooltip multiline label={label} maw={350}>
          {dot}
        </Tooltip>
      </Box>
    );
  }

  // The padding widens the hit area around the small dot without moving it.
  return (
    <Box bottom={4} right={4} pos="absolute" display={"flex"}>
      <Tooltip multiline label={label} maw={350}>
        <UnstyledButton display="flex" p={6} aria-label={action.label} onClick={action.onClick}>
          {dot}
        </UnstyledButton>
      </Tooltip>
    </Box>
  );
};
