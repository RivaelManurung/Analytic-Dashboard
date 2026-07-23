import { Spinner } from "@/components/ui/spinner"

export default function AuthLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center" role="status" aria-label="Loading">
      <Spinner className="size-6" />
    </div>
  )
}
