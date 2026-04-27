
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Customizer } from "@/components/customizer/Customizer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F5F2ED] px-6 py-12">
      <div className="w-full max-w-6xl mx-auto">
        <Header breadcrumb="Studio / Customize" title="Design Your Product" />
        <Customizer />
        <Footer />
      </div>
    </main>
  );
}
