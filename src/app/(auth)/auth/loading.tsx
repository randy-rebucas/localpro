import { Loading } from "@/components/ui/loading";

export default function AuthLoading() {
  return <Loading variant="dashboard" fullScreen text="Loading Authentication" subtitle="Setting up your login..." />;
}
