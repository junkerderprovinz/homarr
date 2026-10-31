"use client";

import { useEffect, useRef } from "react";

import { clientApi } from "@homarr/api/client";
import { useI18n } from "@homarr/translation/client";

import { useFormContext } from "../../_inputs/form";
import { formatLinkedDockerContainer, suggestDockerContainer } from "./container-option";

export const useDockerContainerOptions = (options: Record<string, unknown>) => {
  const t = useI18n("widget.app.option.dockerContainer");
  const form = useFormContext();
  const appId = typeof options.appId === "string" ? options.appId : "";
  const initialAppId = useRef(appId);
  const { data: app } = clientApi.app.byId.useQuery({ id: appId }, { enabled: appId !== "" });
  const { data, isPending, isError } = clientApi.docker.getContainers.useQuery(undefined, {
    retry: false,
  });
  const hasManyEndpoints = (data?.endpoints.length ?? 0) > 1;
  const toOption = (container: { endpointId: string; endpointName: string; name: string }) => ({
    value: formatLinkedDockerContainer(container),
    label: hasManyEndpoints ? `${container.name} (${container.endpointName})` : container.name,
  });
  const suggestion = app && data ? suggestDockerContainer(app, data.containers) : null;
  const suggestedOption = suggestion ? toOption(suggestion) : null;

  // Only an app picked in this dialog gets its container filled in, so a tile left unlinked stays unlinked.
  useEffect(() => {
    if (!suggestedOption || options.dockerContainer || appId === initialAppId.current) return;
    initialAppId.current = appId;
    form.setFieldValue("options.dockerContainer", suggestedOption);
  }, [appId, form, options.dockerContainer, suggestedOption]);

  return {
    isPending,
    error: isError ? t("unavailable") : undefined,
    options: (data?.containers ?? [])
      .map(toOption)
      .toSorted(
        (first, second) =>
          Number(second.value === suggestedOption?.value) - Number(first.value === suggestedOption?.value) ||
          first.label.localeCompare(second.label),
      ),
  };
};
