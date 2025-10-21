export default function DashboardLayout({
  children,
  services,
  stats,
  activity,
  header,
}: {
  children: React.ReactNode;
  services: React.ReactNode;
  stats: React.ReactNode;
  activity: React.ReactNode;
  header: React.ReactNode;
}) {
  return (
    <div>
      {/* Header Section */}
      {header && <div key="dashboard-header">{header}</div>}
      
      {/* Services Section */}
      {services && <div key="dashboard-services">{services}</div>}
      
      {/* Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Stats Section */}
        {stats && <div key="dashboard-stats" className="lg:col-span-2">{stats}</div>}
        
        {/* Activity Section */}
        {activity && <div key="dashboard-activity" className="lg:col-span-1">{activity}</div>}
      </div>
      
      {/* Main Content (children) - for any additional content */}
      {children}
    </div>
  );
}
