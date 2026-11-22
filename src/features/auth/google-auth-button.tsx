import { Button } from '@/components/ui/button'

export function GoogleAuthButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <div className="mb-5 space-y-5">
      <Button type="button" variant="outline" className="h-11 w-full gap-3"
        disabled={disabled} onClick={onClick}>
        <span className="grid size-6 place-items-center rounded-sm bg-white" aria-hidden="true">
          <img src="/google-g.png" alt="" width={18} height={18} className="size-[18px] object-contain" />
        </span>
        Continue with Google
      </Button>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
        or continue with email
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>
    </div>
  )
}
