import { ElectionResult } from "@dashboards/types";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "@hooks/useTranslation";
import { FunctionComponent } from "react";

interface ResultBadgeProps {
  value: ElectionResult | undefined;
  hidden?: boolean;
}

const ResultBadge: FunctionComponent<ResultBadgeProps> = ({ value, hidden = false }) => {
  const { t } = useTranslation("candidates");
  switch (value) {
    case "won":
    case "won_uncontested":
      return <Won desc={!hidden && t(`candidates:${value}`)} />;
    case "lost":
    case "lost_deposit":
      return <Lost desc={!hidden && t(`candidates:${value}`)} />;
    default:
      return <></>;
  }
};

export default ResultBadge;

interface WonProps {
  desc?: string | false;
}

export const Won: FunctionComponent<WonProps> = ({ desc }) => {
  return (
    <span className="text-emerald-500 flex gap-1.5">
      <CheckCircleIcon className="h-4 w-4 self-center" />
      {desc && <span className="whitespace-nowrap uppercase">{desc}</span>}
    </span>
  );
};

interface LostProps {
  desc?: string | false;
}

export const Lost: FunctionComponent<LostProps> = ({ desc }) => {
  return (
    <span className="text-danger flex gap-1.5">
      <XCircleIcon className="h-4 w-4 self-center" />
      {desc && <span className="whitespace-nowrap uppercase">{desc}</span>}
    </span>
  );
};