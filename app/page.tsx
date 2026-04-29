import { Customizer } from "@/components/customizer/Customizer";

export default function Home() {
  return (
    <main className="relative h-screen bg-white overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Customizer />
      </div>
    </main>
  );
}
