export default function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080b12]">
      <div className="flex flex-col items-center gap-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#c8a45c]/20 bg-[#c8a45c]/10">
          <span className="font-display text-lg font-bold text-[#c8a45c]">
            JV
          </span>
        </div>
        <div className="flex gap-1">
          <div className="h-2 w-2 rounded-full bg-[#c8a45c] animate-bounce [animation-delay:0ms]" />
          <div className="h-2 w-2 rounded-full bg-[#c8a45c] animate-bounce [animation-delay:150ms]" />
          <div className="h-2 w-2 rounded-full bg-[#c8a45c] animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
