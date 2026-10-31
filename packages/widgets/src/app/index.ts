import {
  IconApps,
  IconDeviceDesktopX,
  IconEyeOff,
  IconLayoutBottombarExpand,
  IconLayoutNavbarExpand,
  IconLayoutSidebarLeftExpand,
  IconLayoutSidebarRightExpand,
  IconTextScan2,
  IconTooltip,
} from "@tabler/icons-react";
import { useEffect, useRef } from "react";

import { clientApi } from "@homarr/api/client";
import { useI18n } from "@homarr/translation/client";

import { useFormContext } from "../_inputs/form";
import { createWidgetDefinition } from "../definition";
import { optionsBuilder } from "../options";
import { formatLinkedDockerContainer, suggestDockerContainer } from "./docker/container-option";

export const { definition, componentLoader } = createWidgetDefinition("app", {
  icon: IconApps,
  supportsAdvancedFocus: false,
  queryKeys: [[["app", "byId"]], [["widget", "app", "ping"]], [["docker", "getContainers"]]],
  createOptions(settings) {
    return optionsBuilder.from(
      (factory) => ({
        appId: factory.app(),
        openIn: factory.select({
          options: [
            {
              value: "currentTab",
              label: (t) => t("widget.app.option.openIn.option.currentTab"),
            },
            {
              value: "newTab",
              label: (t) => t("widget.app.option.openIn.option.newTab"),
            },
            {
              value: "newWindow",
              label: (t) => t("widget.app.option.openIn.option.newWindow"),
            },
          ],
          defaultValue: "newTab",
          allowDeselect: false,
          withDescription: true,
        }),
        showTitle: factory.switch({ defaultValue: true }),
        descriptionDisplayMode: factory.select({
          options: [
            {
              label(t) {
                return t("widget.app.option.descriptionDisplayMode.option.normal");
              },
              value: "normal",
              icon: IconTextScan2,
            },
            {
              label(t) {
                return t("widget.app.option.descriptionDisplayMode.option.tooltip");
              },
              value: "tooltip",
              icon: IconTooltip,
            },
            {
              label(t) {
                return t("widget.app.option.descriptionDisplayMode.option.hidden");
              },
              value: "hidden",
              icon: IconEyeOff,
            },
          ],
          defaultValue: "hidden",
          searchable: true,
          withDescription: true,
        }),
        layout: factory.select({
          options: [
            {
              label(t) {
                return t("widget.common.layout.option.vertical");
              },
              value: "column",
              icon: IconLayoutNavbarExpand,
            },
            {
              label(t) {
                return t("widget.app.option.layout.option.column-reverse");
              },
              value: "column-reverse",
              icon: IconLayoutBottombarExpand,
            },
            {
              label(t) {
                return t("widget.common.layout.option.horizontal");
              },
              value: "row",
              icon: IconLayoutSidebarLeftExpand,
            },
            {
              label(t) {
                return t("widget.app.option.layout.option.row-reverse");
              },
              value: "row-reverse",
              icon: IconLayoutSidebarRightExpand,
            },
          ],
          defaultValue: "column",
          searchable: true,
        }),
        pingEnabled: factory.switch({ defaultValue: settings.enableStatusByDefault }),
        dockerContainer: factory.dynamicSelect({
          withDescription: true,
          useOptions(_query, _integrationIds, options) {
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
          },
        }),
      }),
      {
        pingEnabled: {
          shouldHide() {
            return settings.forceDisableStatus;
          },
        },
      },
    );
  },
  errors: {
    NOT_FOUND: {
      icon: IconDeviceDesktopX,
      message: (t) => t("widget.app.error.notFound.label"),
      hideLogsLink: true,
    },
  },
}).withDynamicImport(() => import("./component"));
