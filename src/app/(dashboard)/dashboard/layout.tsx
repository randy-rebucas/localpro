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
      {header}
      
      {/* Services Section */}
      {services}
      
      {/* Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stats Section */}
        {stats}
        
        {/* Activity Section */}
        {activity}
      </div>
      
      {/* Main Content (children) - for any additional content */}
      {children}
    </div>
  );
}
