import { clx } from "@lib/helpers";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clx(
        "h-4 w-full animate-bg-gradient-flow rounded-full bg-gradient-to-r",
        "from-0% to-100% from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-700",
        className
      )}
      {...props}
    />
  );
}

export default Skeleton;
