import { BidGenerator } from "@/app/components/bid_generator";

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-6">
      <BidGenerator />
    </div>
  );
}
