import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-toastify";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  MoreHorizontal,
  UserPlus,
  Trash2,
  Edit,
} from "lucide-react";
import { format } from "date-fns";
import { apiClient } from "@/lib/api";
import { useEffect } from "react";
import UserModal from "@/components/admin/UserModal";
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalEmployees: 0,
    pendingApprovals: 0,
    totalLeaveRequests: 0,
    approvedThisMonth: 0,
    rejectedThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userModal, setUserModal] = useState({ isOpen: false, user: null });
  const departments = [
    "Engineering",
    "Marketing",
    "HR",
    "Finance",
    "Operations",
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "approvals") {
      fetchPendingApprovals();
    }
  }, [activeTab, searchTerm, departmentFilter]);

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.getDashboardStats();
      setDashboardStats(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (departmentFilter !== "all") params.department = departmentFilter;

      const response = await apiClient.getUsers(params);
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getLeaveRequests({ status: "PENDING" });
      setPendingApprovals(response.data);
    } catch (error) {
      console.error("Failed to fetch pending approvals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (
    id: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    try {
      await apiClient.updateLeaveRequest(id, { status });
      fetchPendingApprovals();
    } catch (error) {
      console.error("Failed to update leave request:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800";
      case "MANAGER":
        return "bg-blue-100 text-blue-800";
      case "EMPLOYEE":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const handleAddUser = () => {
    setUserModal({ isOpen: true, user: null });
  };

  const handleEditUser = (user: any) => {
    setUserModal({ isOpen: true, user });
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await apiClient.deleteUser(userId);
        toast.success("User deleted successfully");
        fetchUsers();
      } catch (error) {
        toast.error("Failed to delete user");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage employees, leave requests, and system settings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.totalEmployees}
            </div>
            <p className="text-xs text-muted-foreground">+12 from last month</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approvals
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.pendingApprovals}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              This Month Leaves
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.approvedThisMonth}
            </div>
            <p className="text-xs text-muted-foreground">85% approved rate</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.5%</div>
            <p className="text-xs text-muted-foreground">Uptime this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === "overview" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </Button>
        <Button
          variant={activeTab === "users" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("users")}
        >
          Users
        </Button>
        <Button
          variant={activeTab === "approvals" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("approvals")}
        >
          Approvals
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest leave requests and approvals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-4 border-b border-border pb-3"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        John Doe requested vacation leave
                      </p>
                      <p className="text-xs text-muted-foreground">
                        2 hours ago
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-yellow-50 text-yellow-800"
                    >
                      Pending
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Department Overview</CardTitle>
              <CardDescription>Leave statistics by department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departments.map((dept) => (
                  <div key={dept} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{dept}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${Math.random() * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.floor(Math.random() * 20 + 5)} active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "users" && (
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Employee Management</CardTitle>
                <CardDescription>
                  Manage employee accounts and leave balances
                </CardDescription>
              </div>
              <Button className="gradient-primary" onClick={handleAddUser}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Leave Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-xs font-medium text-primary-foreground">
                              {user.firstName.charAt(0)}
                              {user.lastName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.employeeId}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getRoleColor(user.role)}
                          variant="secondary"
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            V: {user.leaveBalances.vacation} | S:{" "}
                            {user.leaveBalances.sick}
                          </div>
                          <div className="text-muted-foreground">
                            C: {user.leaveBalances.casual} | A:{" "}
                            {user.leaveBalances.academic}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getStatusColor(user.status)}
                          variant="secondary"
                        >
                          {user.isActive ? "ACTIVE" : "INACTIVE"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.createdAt), "MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      {activeTab === "approvals" && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>
              Leave requests awaiting manager approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingApprovals.map((request: any) => (
                <div
                  key={request._id}
                  className="border border-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-foreground">
                          {request.userId?.firstName?.charAt(0)}
                          {request.userId?.lastName?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {request.userId?.firstName} {request.userId?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {request.userId?.employeeId}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-yellow-50 text-yellow-800"
                    >
                      {request.leaveType}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(request.from), "MMM dd")} -{" "}
                        {format(new Date(request.to), "MMM dd")} ({request.days}{" "}
                        days)
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Reason</p>
                      <p className="text-sm text-muted-foreground">
                        {request.reason}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Applied On</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(request.createdAt), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() =>
                        handleApproveReject(request._id, "APPROVED")
                      }
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        handleApproveReject(request._id, "REJECTED")
                      }
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button size="sm" variant="outline">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Request Info
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <UserModal
        isOpen={userModal.isOpen}
        onClose={() => setUserModal({ isOpen: false, user: null })}
        user={userModal.user}
        onSuccess={() => {
          fetchUsers();
          fetchDashboardData();
        }}
      />
    </div>
  );
}
