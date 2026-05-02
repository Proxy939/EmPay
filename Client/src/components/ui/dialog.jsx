import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog          = DialogPrimitive.Root
export const DialogTrigger   = DialogPrimitive.Trigger
export const DialogPortal    = DialogPrimitive.Portal
export const DialogClose     = DialogPrimitive.Close

export function DialogOverlay({ className, ...props }) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    />
  )
}

export function DialogContent({ className, children, ...props }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
          'w-full max-w-lg rounded-2xl border border-border/60',
          'bg-card shadow-2xl shadow-black/50 backdrop-blur-xl',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
          'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn('flex flex-col gap-1.5 p-6 pb-0', className)} {...props} />
}

export function DialogFooter({ className, ...props }) {
  return <div className={cn('flex items-center justify-end gap-2 p-6 pt-0', className)} {...props} />
}

export function DialogTitle({ className, ...props }) {
  return (
    <DialogPrimitive.Title
      className={cn('text-base font-semibold leading-none tracking-tight text-foreground', className)}
      {...props}
    />
  )
}

export function DialogDescription({ className, ...props }) {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}
