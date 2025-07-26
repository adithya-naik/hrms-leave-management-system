import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Users, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from "date-fns";
import { apiClient } from "@/lib/api";
import { useEffect } from "react";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const [leaveResponse, holidayResponse] = await Promise.all([
        apiClient.getLeaveRequests({ status: 'APPROVED' }),
        apiClient.getHolidays({ year })
      ]);
      
      setCalendarEvents(leaveResponse.data);
      setHolidays(holidayResponse.data);
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case "VACATION":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "SICK":
        return "bg-red-100 text-red-800 border-red-200";
      case "CASUAL":
        return "bg-green-100 text-green-800 border-green-200";
      case "ACADEMIC":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "WFH":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "COMP_OFF":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getEventsForDate = (date: Date) => {
    return calendarEvents.filter((event: any) => {
      const eventStart = new Date(event.from);
      const eventEnd = new Date(event.to);
      return date >= eventStart && date <= eventEnd;
    });
  };

  const getHolidayForDate = (date: Date) => {
    return holidays.find((holiday) => 
      isSameDay(new Date(holiday.date), date)
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  const selectedHoliday = selectedDate ? getHolidayForDate(selectedDate) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Team Calendar</h1>
        <p className="text-muted-foreground mt-1">
          View team leave schedules and company holidays
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>{format(currentDate, "MMMM yyyy")}</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const events = getEventsForDate(day);
                const holiday = getHolidayForDate(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`
                      min-h-[100px] p-2 border border-border rounded-lg cursor-pointer transition-colors
                      ${isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}
                      ${!isCurrentMonth ? 'opacity-40' : ''}
                      ${isCurrentDay ? 'bg-primary/5' : ''}
                    `}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-primary' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    
                    {holiday && (
                      <div className="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded mb-1 truncate">
                        {holiday.name}
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      {events.slice(0, 2).map((event: any) => (
                        <div
                          key={event._id}
                          className={`text-xs px-1 py-0.5 rounded truncate ${getLeaveTypeColor(event.leaveType)}`}
                        >
                          {event.userId?.firstName}
                        </div>
                      ))}
                      {events.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{events.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Legend */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-100 text-blue-800">VACATION</Badge>
                <span className="text-sm">Vacation Leave</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-red-100 text-red-800">SICK</Badge>
                <span className="text-sm">Sick Leave</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800">CASUAL</Badge>
                <span className="text-sm">Casual Leave</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-indigo-100 text-indigo-800">WFH</Badge>
                <span className="text-sm">Work From Home</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-red-100 text-red-800">Holiday</Badge>
                <span className="text-sm">Company Holiday</span>
              </div>
            </CardContent>
          </Card>

          {/* Selected Date Details */}
          {selectedDate && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedHoliday && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-800">{selectedHoliday.name}</span>
                    </div>
                  </div>
                )}

                {selectedEvents.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Team Members on Leave ({selectedEvents.length})</span>
                    </h4>
                    {selectedEvents.map((event) => (
                      <div key={event._id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {event.userId?.firstName} {event.userId?.lastName}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge
                              className={getLeaveTypeColor(event.leaveType)}
                              variant="secondary"
                            >
                              {event.leaveType}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(event.from), "MMM d")} - {format(new Date(event.to), "MMM d")}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant={event.status === "APPROVED" ? "default" : "secondary"}
                          className={event.status === "APPROVED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                        >
                          {event.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No leave requests for this date
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">This Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Leaves</span>
                <span className="font-medium">{calendarEvents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Approved</span>
                <span className="font-medium text-green-600">
                  {calendarEvents.filter((e: any) => e.status === "APPROVED").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pending</span>
                <span className="font-medium text-yellow-600">
                  {calendarEvents.filter((e: any) => e.status === "PENDING").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Holidays</span>
                <span className="font-medium">{holidays.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}