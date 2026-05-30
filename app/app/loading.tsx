export default function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
          <span className="font-display text-lg font-bold text-primary">
            JV
          </span>
        </div>
        <div className="flex gap-1.5">
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:0ms]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:150ms]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
