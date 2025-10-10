interface SpecTableProps {
  specs: {
    model: string;
    length: string;
    weight: string;
    tipDiameter: string;
    buttDiameter: string;
    torque: string;
    frequency?: string;
    kickPoint?: string;
  }[];
}

export default function SpecTable({ specs }: SpecTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-gray-900 border border-gray-800 rounded-lg">
        <thead>
          <tr className="bg-gray-800">
            <th className="px-4 py-3 text-left text-white font-semibold">Model</th>
            <th className="px-4 py-3 text-left text-white font-semibold">全長(mm)</th>
            <th className="px-4 py-3 text-left text-white font-semibold">重量(g)</th>
            <th className="px-4 py-3 text-left text-white font-semibold">Tip径(mm)</th>
            <th className="px-4 py-3 text-left text-white font-semibold">Butt径(mm)</th>
            <th className="px-4 py-3 text-left text-white font-semibold">トルク(°)</th>
            {specs[0]?.frequency && (
              <th className="px-4 py-3 text-left text-white font-semibold">振動数(cpm)</th>
            )}
            {specs[0]?.kickPoint && (
              <th className="px-4 py-3 text-left text-white font-semibold">K.P.</th>
            )}
          </tr>
        </thead>
        <tbody>
          {specs.map((spec, index) => (
            <tr key={index} className="border-t border-gray-800 hover:bg-gray-800/50">
              <td className="px-4 py-3 text-white font-medium">{spec.model}</td>
              <td className="px-4 py-3 text-gray-300">{spec.length}</td>
              <td className="px-4 py-3 text-gray-300">{spec.weight}</td>
              <td className="px-4 py-3 text-gray-300">{spec.tipDiameter}</td>
              <td className="px-4 py-3 text-gray-300">{spec.buttDiameter}</td>
              <td className="px-4 py-3 text-gray-300">{spec.torque}</td>
              {spec.frequency && (
                <td className="px-4 py-3 text-gray-300">{spec.frequency}</td>
              )}
              {spec.kickPoint && (
                <td className="px-4 py-3 text-gray-300">{spec.kickPoint}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
