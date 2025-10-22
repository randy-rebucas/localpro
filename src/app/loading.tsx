import { Loading } from "@/components/ui/loading";

export default function GlobalLoading() {
  return <Loading variant="dashboard" fullScreen text="Loading application..." subtitle="Please wait while we initialize..." />;
}