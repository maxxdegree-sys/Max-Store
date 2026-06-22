import { useState } from 'react';
import { COMMISSION_SLABS, calculateCommission } from '../../data/commission';
import { formatPKR } from '../../utils/format';

export default function AdminCommission() {
  const [price, setPrice] = useState(2500);
  const calc = calculateCommission(price);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-extrabold">Commission Rates</h1>
        <p className="text-sm text-ink-500 mt-1">
          Flat percentage on the full product price per Changings.txt. Vendors pay platform commission per sold item; record in Accounts manually.
        </p>
      </header>

      <div className="card p-5 max-w-md">
        <h2 className="font-bold text-sm mb-3">Commission calculator</h2>
        <label className="text-sm block">
          <span className="font-semibold text-xs">Product price (Rs.)</span>
          <input type="number" className="input mt-1" value={price} onChange={(e) => setPrice(Number(e.target.value) || 0)} min="1" />
        </label>
        {price > 0 && (
          <dl className="mt-4 text-sm space-y-2">
            <div className="flex justify-between"><dt className="text-ink-500">Applicable slab</dt><dd className="font-semibold">{calc.slab.label}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Commission rate</dt><dd className="font-semibold">{calc.rate}%</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Commission charged</dt><dd className="font-semibold text-rose-600">{formatPKR(calc.commission)}</dd></div>
            <div className="flex justify-between border-t border-ink-100 pt-2"><dt className="text-ink-500">Seller receives</dt><dd className="font-extrabold text-brand-700">{formatPKR(calc.sellerReceives)}</dd></div>
          </dl>
        )}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-100/60 dark:bg-white/5 text-left">
            <tr>
              {['Slab', 'Price range', 'Rate', 'Example price', 'Commission', 'Seller receives'].map((h) => (
                <th key={h} className="px-4 py-3 text-xs uppercase tracking-wider font-bold text-ink-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMMISSION_SLABS.map((s) => (
              <tr key={s.slab} className="border-t border-ink-100 dark:border-white/10">
                <td className="px-4 py-3">{s.slab}</td>
                <td className="px-4 py-3">{s.label}</td>
                <td className="px-4 py-3 font-semibold">{s.rate}%</td>
                <td className="px-4 py-3">{formatPKR(s.example.price)}</td>
                <td className="px-4 py-3 text-rose-600">{formatPKR(s.example.commission)}</td>
                <td className="px-4 py-3 text-brand-700 font-semibold">{formatPKR(s.example.seller)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
