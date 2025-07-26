import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Filter, Search, Calendar, Eye, Edit, Trash2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { toast } from "react-toastify";

const mockLeaveRequests = [
  {
    _id: "1",
    leaveType: "VACATION",
    from: "2024-01-15",
    to: "2024-01-19",
    days: 5,
    status: "APPROVED",
    reason: "Family vacation to the mountains",
    createdAt: "2024-01-01",
    approver: { firstName: "Jane", lastName: "Smith" },
  },
  {
    _id: "2",
    leaveType: "SICK",
    from: "2024-01-22",
    to: "2024-01-22",
    days: 1,
    status: "PENDING",
    reason: "Medical appointment with specialist",
    createdAt: "2024-01-20",
  },
  {
    _id: "3",
    leaveType: "CASUAL",
    from: "2024-01-10",
    to: "2024-01-11",
    days: 2,
    status: "REJECTED",
    reason: "Personal work - house repairs",
    createdAt: "2024-01-05",
    approver: { firstName: "John", lastName: "Manager" },
  },
  {
    _id: "4",
    leaveType: "WFH",
    from: "2024-01-08",
    to: "2024-01-08",
    days: 1,
    status: "APPROVED",
    reason: "Working from home due to internet installation",
    createdAt: "2024-01-06",
    approver: { firstName: "Jane", lastName: "Smith" },
  },
  {
    _id: "5",
    leaveType: "ACADEMIC",
    from: "2024-02-01",
    to: "2024-02-03",
    days: 3,
    status: "PENDING",
    reason: "Attending React conference for professional development",
    createdAt: "2024-01-25",
  },
];

const statusFilters = [
  { value: "all", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const leaveTypeFilters = [
  { value: "all", label: "All Types" },
  { value: "VACATION", label: "Vacation" },
  { value: "SICK", label: "Sick Leave" },
  { value: "CASUAL", label: "Casual" },
  { value: "ACADEMIC", label: "Academic" },
  { value: "WFH", label: "Work From Home" },
  { value: "COMP_OFF", label: "Comp Off" },
];

export default function LeavesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

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
      case "WFH":
        return "bg-indigo-100 text-indigo-800";
      case "COMP_OFF":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "PENDING":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const filteredRequests = mockLeaveRequests.filter((request) => {
    const matchesSearch = request.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.leaveType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesType = typeFilter === "all" || request.leaveType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCancelRequest = (id: string) => {
    toast.success("Leave request cancelled successfully");
    // In real app, would call API to cancel request
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Leave Requests</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all your leave applications
          </p>
        </div>
        <Button asChild className="gradient-primary">
          <Link to="/leaves/new">
            <Plus className="h-4 w-4 mr-2" />
            Apply for Leave
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by reason or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusFilters.map((filter) => (
                    <SelectItem key={filter.value} value={filter.value}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Leave Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypeFilters.map((filter) => (
                    <SelectItem key={filter.value} value={filter.value}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Leave Requests ({filteredRequests.length})</CardTitle>
          <CardDescription>
            All your leave applications with current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No leave requests found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters to see more results."
                  : "You haven't submitted any leave requests yet."}
              </p>
              <Button asChild>
                <Link to="/leaves/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Apply for Leave
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell>
                        <Badge
                          className={getLeaveTypeColor(request.leaveType)}
                          variant="secondary"
                        >
                          {request.leaveType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {format(new Date(request.from), "MMM dd, yyyy")}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            to {format(new Date(request.to), "MMM dd, yyyy")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{request.days}</span>
                        <span className="text-sm text-muted-foreground ml-1">
                          day{request.days > 1 ? 's' : ''}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(request.status)}
                          <Badge
                            className={getStatusColor(request.status)}
                            variant="outline"
                          >
                            {request.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm truncate" title={request.reason}>
                            {request.reason}
                          </p>
                          {request.approver && (
                            <p className="text-xs text-muted-foreground">
                              by {request.approver.firstName} {request.approver.lastName}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(request.createdAt), "MMM dd, yyyy")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {request.status === "PENDING" && (
                            <>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelRequest(request._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}