"use client";

import { ActionIcon, Box, Tooltip } from "@mantine/core";
import { IconPlayerPlayFilled, IconPlayerStopFilled } from "@tabler/icons-react";

import { clientApi } from "@homarr/api/client";
import type { ContainerState } from "@homarr/docker";
import { containerStateColorMap } from "@homarr/docker/shared";
import { showErrorNotification } from "@homarr/notifications";
import { useI18n } from "@homarr/translation/client";

import type { LinkedDockerContainer } from "./container-option";

const activeStates: ContainerState[] = ["running", "restarting", "paused"];

const useToggleAction = (action: "start" | "stop", name: string) => {
  const t = useI18n();
  const utils = clientApi.useUtils();
  const notifyFailure = (message: string) =>
    showErrorNotification({ title: t(`widget.app.docker.notification.${action}Failed`, { name }), message });

  return clientApi.docker[`${action}All`].useMutation({
    async onSettled() {
      await utils.docker.getContainers.invalidate();
    },
    onSuccess([result]) {
      if (result && !result.success) notifyFailure(result.error);
    },
    onError(error) {
      notifyFailure(error.message);
    },
  });
};

interface DockerContainerToggleProps {
  container: LinkedDockerContainer;
  isTiny: boolean;
  isEditMode: boolean;
}

export const DockerContainerToggle = ({ container: linked, isTiny, isEditMode }: DockerContainerToggleProps) => {
  const t = useI18n();
  const { data } = clientApi.docker.getContainers.useQuery(
    { endpointIds: [linked.endpointId] },
    { refetchInterval: 30_000 },
  );
  const start = useToggleAction("start", linked.name);
  const stop = useToggleAction("stop", linked.name);

  const container = data?.containers.find(
    ({ endpointId, name }) => endpointId === linked.endpointId && name === linked.name,
  );
  if (!container) return null;

  const canControl =
    data?.endpoints.find(({ id }) => id === linked.endpointId)?.capabilities.includes("lifecycle") ?? false;
  const isActive = activeStates.includes(container.state);
  const mutation = isActive ? stop : start;
  const stateLabel = t(`docker.field.state.option.${container.state}`);
  const actionLabel = t(`widget.app.docker.action.${isActive ? "stop" : "start"}`, { name: container.name });
  const Icon = isActive ? IconPlayerStopFilled : IconPlayerPlayFilled;
  const isPending = start.isPending || stop.isPending;

  return (
    // Mirrors the status dot, centered on the same line, and keeps clear of a title at the top.
    <Box pos="absolute" bottom={isTiny ? 6 : 4} left={isTiny ? 6 : 4}>
      <Tooltip label={canControl ? `${stateLabel} · ${actionLabel}` : `${container.name}: ${stateLabel}`}>
        <ActionIcon
          size={isTiny ? "xs" : "sm"}
          radius="xl"
          variant="light"
          color={containerStateColorMap[container.state]}
          aria-label={actionLabel}
          loading={isPending}
          data-disabled={isEditMode || !canControl || undefined}
          onClick={() => {
            if (isEditMode || !canControl) return;
            mutation.mutate({ targets: [{ endpointId: container.endpointId, id: container.id }] });
          }}
        >
          <Icon size="60%" />
        </ActionIcon>
      </Tooltip>
    </Box>
  );
};
