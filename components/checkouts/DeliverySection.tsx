import { ChevronDown } from "lucide-react";
import { INPUT_CLASS, SELECT_CLASS } from "@/constants/ui";
import type { WilayahValue } from "@/types/checkout";
import WilayahSelect from "@/components/checkouts/WilayahSelect";

interface DeliverySectionProps {
  firstName: string;
  onFirstNameChange: (value: string) => void;
  lastName: string;
  onLastNameChange: (value: string) => void;
  address: string;
  onAddressChange: (value: string) => void;
  zip: string;
  onZipChange: (value: string) => void;
  phone: string;
  onPhoneChange: (value: string) => void;
  wilayah: WilayahValue;
  onWilayahChange: (value: WilayahValue) => void;
}

export function DeliverySection({
  firstName,
  onFirstNameChange,
  lastName,
  onLastNameChange,
  address,
  onAddressChange,
  zip,
  onZipChange,
  phone,
  onPhoneChange,
  wilayah,
  onWilayahChange,
}: DeliverySectionProps) {
  return (
    <section className="mb-8">
      <h2 className=" text-xl text-stone-800 mb-4">Delivery</h2>
      <div className="space-y-3">
        {/* Country */}
        <div className="relative">
          <select className={SELECT_CLASS} defaultValue="Indonesia">
            <option>Indonesia</option>
          </select>
          <ChevronDown
            size={12}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
          />
        </div>

        {/* Name */}
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            className={INPUT_CLASS}
          />
          <input
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        {/* Street address */}
        <input
          type="text"
          placeholder="Alamat lengkap (jalan, nomor, RT/RW)"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          className={INPUT_CLASS}
        />

        {/* Region cascade */}
        <WilayahSelect value={wilayah} onChange={onWilayahChange} />

        {/* ZIP & Phone */}
        <input
          type="text"
          placeholder="Kode Pos"
          value={zip}
          onChange={(e) => onZipChange(e.target.value)}
          className={INPUT_CLASS}
        />
        <input
          type="tel"
          placeholder="Nomor HP"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>
    </section>
  );
}
