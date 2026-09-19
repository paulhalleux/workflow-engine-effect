import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const buttonVariants = cva("ui-button", {
  variants: {
    variant: {
      default: "ui-button--default",
      destructive: "ui-button--destructive",
      ghost: "ui-button--ghost",
      outline: "ui-button--outline",
      secondary: "ui-button--secondary",
    },
    size: {
      default: "ui-button--default-size",
      icon: "ui-button--icon",
      small: "ui-button--small",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} type={type} {...props} />
  );
}
