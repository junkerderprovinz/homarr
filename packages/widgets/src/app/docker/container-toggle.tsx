"use client";

import { IconCheck, IconMinus, IconX } from "@tabler/icons-react";

import { clientApi } from "@homarr/api/client";
import type { ContainerState } from "@homarr/docker";
import { containerStateColorMap } from "@homarr/docker/shared";
import { showErrorNotification } from "@homarr/notifications";
import { useI18n } from "@homarr/translation/client";

import { PingDot } from "../ping/ping-dot";
import { PingIndicator } from "../ping/ping-indicator";
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
  pingAppId: string | null;
  isEditMode: boolean;
}

// Turns the status dot into the switch: it keeps the ping color when pinging is on and shows the container state
// otherwise.
export const DockerContainerToggle = ({ container: linked, pingAppId, isEditMode }: DockerContainerToggleProps) => {
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
  if (!container) return pingAppId ? <PingIndicator appId={pingAppId} /> : null;

  if (start.isPending || stop.isPending) {
    return <PingDot icon={IconMinus} color="gray" tooltip={`${t("common.action.loading")}…`} />;
  }

  const canControl =
    data?.endpoints.find(({ id }) => id === linked.endpointId)?.capabilities.includes("lifecycle") ?? false;
  const isActive = activeStates.includes(container.state);
  const stateLabel = t(`docker.field.state.option.${container.state}`);
  const actionLabel = t(`widget.app.docker.action.${isActive ? "stop" : "start"}`, { name: container.name });
  const action =
    canControl && !isEditMode
      ? {
          label: actionLabel,
          onClick: () =>
            (isActive ? stop : start).mutate({ targets: [{ endpointId: container.endpointId, id: container.id }] }),
        }
      : undefined;
  const hint = action ? `${stateLabel} · ${actionLabel}` : `${container.name}: ${stateLabel}`;

  if (pingAppId) return <PingIndicator appId={pingAppId} hint={hint} action={action} />;

  return (
    <PingDot
      icon={isActive ? IconCheck : IconX}
      color={containerStateColorMap[container.state]}
      tooltip={hint}
      action={action}
    />
  );
};
