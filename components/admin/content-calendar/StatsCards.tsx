interface StatsCardsProps {
  totalContent: number;
  published: number;
  draft: number;
  scheduled: number;
}

export const StatsCards = ({ totalContent, published, draft, scheduled }: StatsCardsProps) => {
  const stats = [
    {
      label: '총 콘텐츠',
      value: totalContent,
      icon: '📝',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: '발행 완료',
      value: published,
      icon: '✅',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: '초안',
      value: draft,
      icon: '📋',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      label: '예약됨',
      value: scheduled,
      icon: '📅',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div key={index} className={`${stat.bgColor} p-4 rounded-lg border border-gray-200`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
            <span className="text-2xl">{stat.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
