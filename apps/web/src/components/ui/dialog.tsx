import { Dialog as BaseDialog } from "@base-ui/react/dialog";

export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;
export const DialogTitle = BaseDialog.Title;
export const DialogDescription = BaseDialog.Description;

export function DialogContent({ children }: { children: React.ReactNode }) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="ui-dialog__backdrop" />
      <BaseDialog.Viewport className="ui-dialog__viewport">
        <BaseDialog.Popup className="ui-dialog__content">{children}</BaseDialog.Popup>
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  );
}
