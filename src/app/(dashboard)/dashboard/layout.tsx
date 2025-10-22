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
      
      {/* Activity Section - Full Width */}
      {activity && <div key="dashboard-activity" className="mt-8">{activity}</div>}
      
      {/* Main Content (children) - for any additional content */}
      {children}
    </div>
  );
}
