import { Spinner } from "./ui/spinner";

export function Loading() {
  return (
      <div className="flex justify-center items-center h-full">
          <Spinner className="size-20" />
      </div>
  );
}