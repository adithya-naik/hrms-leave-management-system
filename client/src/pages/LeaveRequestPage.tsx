import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import { toast } from "react-toastify";
import { format, differenceInDays, isWeekend, addDays } from "date-fns";

const leaveTypes = [
  { value: "VACATION", label: "Vacation", description: "Planned time off for personal activities" },
  { value: "SICK", label: "Sick Leave", description: "Medical leave for illness or health issues" },
  { value: "CASUAL", label: "Casual Leave", description: "Short-term personal leave" },
  { value: "ACADEMIC", label: "Academic Leave", description: "Educational or training purposes" },
  { value: "WFH", label: "Work From Home", description: "Remote work arrangement" },
  { value: "COMP_OFF", label: "Comp Off", description: "Compensatory time off" },
];

export default function LeaveRequestPage() {
  const [formData, setFormData] = useState({
    leaveType: "",
    fromDate: "",
    toDate: "",
    reason: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const calculateWorkingDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) return 0;
    
    let workingDays = 0;
    let currentDate = new Date(start);
    
    while (currentDate <= end) {
      if (!isWeekend(currentDate)) {
        workingDays++;
      }
      currentDate = addDays(currentDate, 1);
    }
    
    return workingDays;
  };

  const workingDays = calculateWorkingDays(formData.fromDate, formData.toDate);

  const getLeaveBalance = (type: string) => {
    if (!user) return 0;
    switch (type) {
      case "SICK":
        return user.leaveBalances.sick;
      case "CASUAL":
        return user.leaveBalances.casual;
      case "VACATION":
        return user.leaveBalances.vacation;
      case "ACADEMIC":
        return user.leaveBalances.academic;
      default:
        return 0;
    }
  };

  const availableBalance = formData.leaveType ? getLeaveBalance(formData.leaveType) : 0;
  const isInsufficientBalance = workingDays > availableBalance && formData.leaveType !== "WFH" && formData.leaveType !== "COMP_OFF";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isInsufficientBalance) {
      toast.error("Insufficient leave balance for the selected dates.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Mock API call - in real app, this would be apiClient.createLeaveRequest
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Leave request submitted successfully! Your manager will review it shortly.");
      navigate("/leaves");
    } catch (error) {
      toast.error("Failed to submit leave request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedLeaveType = leaveTypes.find(type => type.value === formData.leaveType);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Apply for Leave</h1>
        <p className="text-muted-foreground mt-1">
          Submit a new leave request for approval
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Leave Request Form</span>
          </CardTitle>
          <CardDescription>
            Fill in the details for your leave request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Leave Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type *</Label>
              <Select
                value={formData.leaveType}
                onValueChange={(value) => setFormData({ ...formData, leaveType: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedLeaveType && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{selectedLeaveType.label}</p>
                    <p className="text-xs text-muted-foreground">{selectedLeaveType.description}</p>
                  </div>
                  {formData.leaveType !== "WFH" && formData.leaveType !== "COMP_OFF" && (
                    <Badge variant="outline">
                      {availableBalance} days available
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Date Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromDate">From Date *</Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={formData.fromDate}
                  onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                  min={format(new Date(), "yyyy-MM-dd")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toDate">To Date *</Label>
                <Input
                  id="toDate"
                  type="date"
                  value={formData.toDate}
                  onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                  min={formData.fromDate || format(new Date(), "yyyy-MM-dd")}
                  required
                />
              </div>
            </div>

            {/* Working Days Calculation */}
            {formData.fromDate && formData.toDate && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Duration Calculation</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Working days:</span>
                    <span className="ml-2 font-medium">{workingDays}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Weekend days excluded:</span>
                    <span className="ml-2 font-medium">
                      {differenceInDays(new Date(formData.toDate), new Date(formData.fromDate)) + 1 - workingDays}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Insufficient Balance Warning */}
            {isInsufficientBalance && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Insufficient leave balance. You have {availableBalance} days available but requesting {workingDays} days.
                </AlertDescription>
              </Alert>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Leave *</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a brief reason for your leave request..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={4}
                required
              />
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4">
              <Button
                type="submit"
                disabled={isSubmitting || isInsufficientBalance}
                className="flex-1 gradient-primary"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/leaves")}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Leave Balance Summary */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Your Leave Balance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{user?.leaveBalances.vacation}</div>
              <div className="text-sm text-blue-700">Vacation</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{user?.leaveBalances.casual}</div>
              <div className="text-sm text-green-700">Casual</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{user?.leaveBalances.sick}</div>
              <div className="text-sm text-red-700">Sick</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{user?.leaveBalances.academic}</div>
              <div className="text-sm text-purple-700">Academic</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}