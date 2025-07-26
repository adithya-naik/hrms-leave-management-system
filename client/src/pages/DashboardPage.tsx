import { Calendar, Clock, FileText, TrendingUp, Users, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { Link } from "react-router-dom";
import { format, addDays, startOfMonth, endOfMonth } from "date-fns";

const mockLeaveRequests = [
  {
    _id: "1",
    leaveType: "VACATION",
    from: "2024-01-15",
    to: "2024-01-19",
    days: 5,
    status: "APPROVED",
    reason: "Family vacation",
  },
  {
    _id: "2",
    leaveType: "SICK",
    from: "2024-01-22",
    to: "2024-01-22",
    days: 1,
    status: "PENDING",
    reason: "Medical appointment",
  },
  {
    _id: "3",
    leaveType: "CASUAL",
    from: "2024-01-10",
    to: "2024-01-11",
    days: 2,
    status: "REJECTED",
    reason: "Personal work",
  },
];

const mockUpcomingLeaves = [
  {
    _id: "1",
    user: { firstName: "Alice", lastName: "Johnson" },
    leaveType: "VACATION",
    from: "2024-01-25",
    to: "2024-01-29",
    days: 5,
  },
  {
    _id: "2",
    user: { firstName: "Bob", lastName: "Wilson" },
    leaveType: "SICK",
    from: "2024-01-30",
    to: "2024-01-30",
    days: 1,
  },
];

export default function DashboardPage() {
  const { user } = useAuthStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case "VACATION":
        return "bg-blue-100 text-blue-800";
      case "SICK":
        return "bg-red-100 text-red-800";
      case "CASUAL":
        return "bg-green-100 text-green-800";
      case "ACADEMIC":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's an overview of your leave status and upcoming activities.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vacation Days</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">20</div>
            <p className="text-xs text-muted-foreground">
              +2 from last year
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Used</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              12 days remaining
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <FileText className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              In your department
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leave Requests */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Recent Leave Requests</span>
            </CardTitle>
            <CardDescription>
              Your latest leave applications and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockLeaveRequests.map((request) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge
                        className={getLeaveTypeColor(request.leaveType)}
                        variant="secondary"
                      >
                        {request.leaveType}
                      </Badge>
                      <Badge
                        className={getStatusColor(request.status)}
                        variant="outline"
                      >
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">
                      {format(new Date(request.from), "MMM dd")} - {format(new Date(request.to), "MMM dd")}
                      <span className="text-muted-foreground ml-2">
                        ({request.days} day{request.days > 1 ? 's' : ''})
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {request.reason}
                    </p>
                  </div>
                  <div className="ml-4">
                    {request.status === "APPROVED" && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {request.status === "PENDING" && (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                    {request.status === "REJECTED" && (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link to="/leaves">View All Requests</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Team Leaves */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Upcoming Team Leaves</span>
            </CardTitle>
            <CardDescription>
              Leave schedules for your team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockUpcomingLeaves.map((leave) => (
                <div
                  key={leave._id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-foreground">
                        {leave.user.firstName.charAt(0)}{leave.user.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {leave.user.firstName} {leave.user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(leave.from), "MMM dd")} - {format(new Date(leave.to), "MMM dd")}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={getLeaveTypeColor(leave.leaveType)}
                    variant="secondary"
                  >
                    {leave.leaveType}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link to="/calendar">View Team Calendar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks you might want to perform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild className="h-20 flex-col space-y-2 gradient-primary">
              <Link to="/leaves/new">
                <Clock className="h-6 w-6" />
                <span>Apply for Leave</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2">
              <Link to="/calendar">
                <Calendar className="h-6 w-6" />
                <span>View Calendar</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2">
              <Link to="/profile">
                <Users className="h-6 w-6" />
                <span>Update Profile</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}