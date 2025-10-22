export default function DashboardLayout({
  children,
  services,
  activity,
  header,
  announcements,
}: {
  children: React.ReactNode;
  services: React.ReactNode;
  activity: React.ReactNode;
  header: React.ReactNode;
  announcements: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      {header && <div key="dashboard-header">{header}</div>}
      
      {/* Services Section */}
      {services && <div key="dashboard-services">{services}</div>}
      
      {/* Announcements Section */}
      {announcements && <div key="dashboard-announcements">{announcements}</div>}
      
      {/* Activity Section - Full Width */}
      {activity && <div key="dashboard-activity">{activity}</div>}
      
      {/* Main Content (children) - for any additional content */}
      {children}
    </div>
  );
}
