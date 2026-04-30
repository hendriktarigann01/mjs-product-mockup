import type { ShippingService } from "@/components/checkouts/ShippingMethod";
import ShippingMethod from "@/components/checkouts/ShippingMethod";

interface ShippingSectionProps {
  kecamatanId: string;
  kecamatanName: string;
  kabupatenName: string;
  selectedShipping: ShippingService | null;
  onSelect: (service: ShippingService) => void;
}

export function ShippingSection({
  kecamatanId,
  kecamatanName,
  kabupatenName,
  selectedShipping,
  onSelect,
}: ShippingSectionProps) {
  return (
    <section className="mb-8">
      <h2 className=" text-xl text-stone-800 mb-4">
        Shipping method
      </h2>
      <ShippingMethod
        kecamatanId={kecamatanId}
        kecamatanName={kecamatanName}
        kabupatenName={kabupatenName}
        selected={selectedShipping}
        onSelect={onSelect}
      />
    </section>
  );
}
