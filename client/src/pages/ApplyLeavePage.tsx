import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, FileText, AlertCircle, ArrowLeft, Send, RefreshCw } from "lucide-react";
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
import { format, differenceInDays, isWeekend, addDays, isBefore, startOfDay } from "date-fns";
import { apiClient } from "@/lib/api";

const leaveTypes = [
  { 
    value: "VACATION", 
    label: "Vacation", 
    description: "Annual vacation days", 
    color: "bg-blue-100 text-blue-800",
    balanceKey: "vacation"
  },
  { 
    value: "SICK", 
    label: "Sick Leave", 
    description: "Medical leave for illness or health issues", 
    color: "bg-red-100 text-red-800",
    balanceKey: "sick"
  },
  { 
    value: "CASUAL", 
    label: "Casual Leave", 
    description: "Short-term personal leave", 
    color: "bg-green-100 text-green-800",
    balanceKey: "casual"
  },
  { 
    value: "ACADEMIC", 
    label: "Academic Leave", 
    description: "Educational or training purposes", 
    color: "bg-purple-100 text-purple-800",
    balanceKey: "academic"
  },
  { 
    value: "WFH", 
    label: "Work From Home", 
    description: "Remote work arrangement", 
    color: "bg-indigo-100 text-indigo-800",
    balanceKey: null
  },
  { 
    value: "COMP_OFF", 
    label: "Comp Off", 
    description: "Compensatory time off", 
    color: "bg-orange-100 text-orange-800",
    balanceKey: null
  },
];

export default function ApplyLeavePage() {
  const [formData, setFormData] = useState({
    leaveType: "",
    fromDate: "",
    toDate: "",
    reason: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const { user, refreshUser } = useAuthStore();
  const navigate = useNavigate();

  // Fetch fresh user data with leave balances
  useEffect(() => {
    fetchUserProfile();
    fetchHolidays();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoadingProfile(true);
      const response = await apiClient.getCurrentUser();
      setUserProfile(response.data);
      
      // Update auth store if needed
      if (response.data && (!user?.leaveBalances || Object.values(user.leaveBalances).every(val => val === 0))) {
        refreshUser?.(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setUserProfile(user); // Fallback to current user
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchHolidays = async () => {
    try {
      const response = await apiClient.getHolidays();
      setHolidays(response.data || []);
    } catch (error) {
      console.error('Failed to fetch holidays:', error);
      setHolidays([]);
    }
  };

  const calculateWorkingDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) return 0;
    
    let workingDays = 0;
    let currentDate = new Date(start);
    
    while (currentDate <= end) {
      if (!isWeekend(currentDate)) {
        // Check if it's not a holiday
        const isHoliday = holidays.some((holiday: any) => 
          new Date(holiday.date).toDateString() === currentDate.toDateString()
        );
        if (!isHoliday) {
          workingDays++;
        }
      }
      currentDate = addDays(currentDate, 1);
    }
    
    return workingDays;
  };

  const workingDays = calculateWorkingDays(formData.fromDate, formData.toDate);

  // Use userProfile if available, otherwise fallback to user from auth store
  const currentUser = userProfile || user;

  const getLeaveBalance = (type: string) => {
    if (!currentUser?.leaveBalances) return 0;
    
    const selectedType = leaveTypes.find(lt => lt.value === type);
    if (!selectedType?.balanceKey) return 0;
    
    return currentUser.leaveBalances[selectedType.balanceKey] || 0;
  };

  const availableBalance = formData.leaveType ? getLeaveBalance(formData.leaveType) : 0;
  const isInsufficientBalance = workingDays > availableBalance && 
    formData.leaveType !== "WFH" && 
    formData.leaveType !== "COMP_OFF" && 
    formData.leaveType !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.leaveType || !formData.fromDate || !formData.toDate || !formData.reason.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Validate dates
    const today = startOfDay(new Date());
    const fromDate = new Date(formData.fromDate);
    const toDate = new Date(formData.toDate);
    
    if (isBefore(fromDate, today)) {
      toast.error("Cannot apply for leave in the past.");
      return;
    }

    if (isBefore(toDate, fromDate)) {
      toast.error("End date must be after start date.");
      return;
    }
    
    if (isInsufficientBalance) {
      toast.error(`Insufficient leave balance. You have ${availableBalance} days available but requesting ${workingDays} days.`);
      return;
    }

    if (workingDays === 0) {
      toast.error("No working days selected. Please choose dates that include working days.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiClient.createLeaveRequest({
        leaveType: formData.leaveType,
        from: new Date(formData.fromDate).toISOString(),
        to: new Date(formData.toDate).toISOString(),
        reason: formData.reason.trim()
      });
      
      toast.success("Leave request submitted successfully! Your manager will review it shortly.");
      navigate("/leaves");
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to submit leave request. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedLeaveType = leaveTypes.find(type => type.value === formData.leaveType);
  const totalCalendarDays = formData.fromDate && formData.toDate ? 
    differenceInDays(new Date(formData.toDate), new Date(formData.fromDate)) + 1 : 0;
  const weekendDays = totalCalendarDays - workingDays;

  // Leave balance with defaults from schema
  const leaveBalances = {
    vacation: currentUser?.leaveBalances?.vacation ?? 21,
    sick: currentUser?.leaveBalances?.sick ?? 12,
    casual: currentUser?.leaveBalances?.casual ?? 12,
    academic: currentUser?.leaveBalances?.academic ?? 5
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/leaves")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Leaves</span>
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={fetchUserProfile}
          disabled={loadingProfile}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${loadingProfile ? 'animate-spin' : ''}`} />
          <span>Refresh Balance</span>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Apply for Leave</h1>
        <p className="text-muted-foreground mt-1">
          Submit a new leave request for approval
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
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
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${type.color.split(' ')[0]}`}></div>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedLeaveType && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${selectedLeaveType.color.split(' ')[0]}`}></div>
                        <div>
                          <p className="text-sm font-medium">{selectedLeaveType.label}</p>
                          <p className="text-xs text-muted-foreground">{selectedLeaveType.description}</p>
                        </div>
                      </div>
                      {selectedLeaveType.balanceKey && (
                        <Badge variant="outline" className={selectedLeaveType.color}>
                          {availableBalance} days available
                        </Badge>
                      )}
                      {!selectedLeaveType.balanceKey && (
                        <Badge variant="outline" className="bg-gray-100 text-gray-800">
                          No limit
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

                {/* Duration Display */}
                {formData.fromDate && formData.toDate && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Duration Summary</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">{totalCalendarDays}</div>
                        <div className="text-muted-foreground">Total Days</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{workingDays}</div>
                        <div className="text-muted-foreground">Working Days</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-600">{weekendDays}</div>
                        <div className="text-muted-foreground">Weekends/Holidays</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Insufficient Balance Warning */}
                {isInsufficientBalance && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Insufficient leave balance. You have <strong>{availableBalance}</strong> days available 
                      but requesting <strong>{workingDays}</strong> working days.
                    </AlertDescription>
                  </Alert>
                )}

                {/* No Working Days Warning */}
                {formData.fromDate && formData.toDate && workingDays === 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      The selected date range contains no working days. Please choose dates that include weekdays.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Reason */}
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Leave *</Label>
                  <Textarea
                    id="reason"
                    placeholder="Please provide a detailed reason for your leave request..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={4}
                    maxLength={500}
                    required
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Provide a clear and concise reason for better approval chances</span>
                    <span>{formData.reason.length}/500</span>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting || isInsufficientBalance || workingDays === 0}
                    className="flex-1 gradient-primary"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Send className="h-4 w-4" />
                        <span>Submit Request</span>
                      </div>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/leaves")}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          {/* Request Summary */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Request Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Employee</Label>
                <div className="flex items-center space-x-3 mt-1">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-foreground">
                      {currentUser?.firstName?.charAt(0)}{currentUser?.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{currentUser?.firstName} {currentUser?.lastName}</p>
                    <p className="text-xs text-muted-foreground">ID: {currentUser?.employeeId}</p>
                    <p className="text-xs text-muted-foreground">{currentUser?.department}</p>
                  </div>
                </div>
              </div>

              {selectedLeaveType && (
                <div>
                  <Label className="text-sm font-medium">Leave Type</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className={`w-3 h-3 rounded-full ${selectedLeaveType.color.split(' ')[0]}`}></div>
                    <span className="text-sm">{selectedLeaveType.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{selectedLeaveType.description}</p>
                </div>
              )}

              {formData.fromDate && formData.toDate && (
                <div>
                  <Label className="text-sm font-medium">Duration</Label>
                  <div className="mt-1">
                    <p className="text-sm">
                      {format(new Date(formData.fromDate), "MMM dd, yyyy")} - {format(new Date(formData.toDate), "MMM dd, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {workingDays} working day{workingDays !== 1 ? 's' : ''}
                      {totalCalendarDays !== workingDays && ` (${totalCalendarDays} total)`}
                    </p>
                  </div>
                </div>
              )}

              {formData.reason && (
                <div>
                  <Label className="text-sm font-medium">Reason</Label>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                    {formData.reason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leave Balance */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Leave Balance</span>
              </CardTitle>
              {loadingProfile && (
                <div className="text-xs text-muted-foreground">Refreshing...</div>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="text-xl font-bold text-blue-600">{leaveBalances.vacation}</div>
                  <div className="text-xs text-blue-700">Vacation</div>
                  <div className="text-xs text-blue-600 mt-1">Default: 21</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                  <div className="text-xl font-bold text-green-600">{leaveBalances.casual}</div>
                  <div className="text-xs text-green-700">Casual</div>
                  <div className="text-xs text-green-600 mt-1">Default: 12</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg border-2 border-red-200">
                  <div className="text-xl font-bold text-red-600">{leaveBalances.sick}</div>
                  <div className="text-xs text-red-700">Sick</div>
                  <div className="text-xs text-red-600 mt-1">Default: 12</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <div className="text-xl font-bold text-purple-600">{leaveBalances.academic}</div>
                  <div className="text-xs text-purple-700">Academic</div>
                  <div className="text-xs text-purple-600 mt-1">Default: 5</div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600 text-center">
                  Last updated: {currentUser?.lastLogin ? format(new Date(currentUser.lastLogin), "MMM dd, HH:mm") : "Never"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
