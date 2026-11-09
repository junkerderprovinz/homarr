import type { MantineColor } from "@mantine/core";
import { Box, Tooltip } from "@mantine/core";

import { useSettings } from "@homarr/settings";
import type { TablerIcon } from "@homarr/ui";

import classes from "./ping-dot.module.css";

interface PingDotProps {
  icon: TablerIcon;
  color: MantineColor;
  tooltip: string;
  pulse?: boolean;
}

export const PingDot = ({ color, tooltip, pulse, ...props }: PingDotProps) => {
  const { pingIconsEnabled } = useSettings();
  const className = pulse ? classes.pulse : undefined;

  return (
    <Box bottom={10} right={10} pos="absolute" display={"flex"}>
      <Tooltip multiline label={tooltip} maw={350}>
        {pingIconsEnabled ? (
          <props.icon className={className} style={{ width: 12, height: 12 }} strokeWidth={4} color={color} />
        ) : (
          <Box
            className={className}
            bg={color}
            style={{
              borderRadius: "100%",
            }}
            w={10}
            h={10}
          ></Box>
        )}
      </Tooltip>
    </Box>
  );
};
