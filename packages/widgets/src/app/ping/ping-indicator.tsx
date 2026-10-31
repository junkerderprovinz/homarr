import { IconCheck, IconMinus, IconX } from "@tabler/icons-react";

import { clientApi } from "@homarr/api/client";
import { useI18n } from "@homarr/translation/client";

import type { PingDotAction } from "./ping-dot";
import { PingDot } from "./ping-dot";

interface PingIndicatorProps {
  appId: string;
  hint?: string;
  action?: PingDotAction;
}

export const PingIndicator = ({ appId, ...dotProps }: PingIndicatorProps) => {
  const t = useI18n("common");
  const { data: pingResult, error } = clientApi.widget.app.ping.useQuery({ id: appId }, { refetchOnMount: false });

  if (error) return <PingDot icon={IconX} color="red" tooltip={t("error")} {...dotProps} />;

  if (!pingResult) return <PingDot icon={IconMinus} color="gray" tooltip={`${t("action.loading")}…`} {...dotProps} />;

  const isError = "error" in pingResult || pingResult.statusCode >= 500;

  return (
    <PingDot
      icon={isError ? IconX : IconCheck}
      color={isError ? "red" : "green"}
      tooltip={
        "statusCode" in pingResult
          ? `${pingResult.statusCode} - ${pingResult.durationMs.toFixed(0)}ms`
          : pingResult.error
      }
      {...dotProps}
    />
  );
};
