import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--primary-color)]">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to CHAAX Project Management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card hover>
          <CardContent>
            <div className="text-center">
              <p className="text-gray-600 text-sm">Total Projects</p>
              <p className="text-3xl font-bold text-[var(--primary-color)] mt-2">12</p>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent>
            <div className="text-center">
              <p className="text-gray-600 text-sm">Active Tasks</p>
              <p className="text-3xl font-bold text-[var(--secondary-color)] mt-2">48</p>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent>
            <div className="text-center">
              <p className="text-gray-600 text-sm">Team Members</p>
              <p className="text-3xl font-bold text-[var(--primary-color)] mt-2">24</p>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent>
            <div className="text-center">
              <p className="text-gray-600 text-sm">Completed</p>
              <p className="text-3xl font-bold text-green-600 mt-2">156</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">No recent activity</p>
            <Button variant="primary">View All Activity</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
