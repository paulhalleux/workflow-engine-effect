import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ReactElement, ReactNode } from "react";

interface TooltipProps {
  children: ReactElement;
  content: ReactNode;
}

export const TooltipProvider = BaseTooltip.Provider;

export function Tooltip({ children, content }: TooltipProps) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner sideOffset={8}>
          <BaseTooltip.Popup className="tooltip-popup">
            {content}
            <BaseTooltip.Arrow className="tooltip-arrow" />
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
