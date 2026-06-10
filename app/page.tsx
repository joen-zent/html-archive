import { getEntries } from "@/lib/entries";
import Archive from "@/components/Archive";

export default function Home() {
  const entries = getEntries();
  return <Archive entries={entries} />;
}
