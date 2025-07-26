import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/api";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  onSuccess: () => void;
}

const departments = ["Engineering", "Marketing", "HR", "Finance", "Operations"];
const roles = ["EMPLOYEE", "MANAGER", "ADMIN"];

export default function UserModal({ isOpen, onClose, user, onSuccess }: UserModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    department: "",
    managerId: "none", // Changed from empty string to "none"
    isActive: true,
    leaveBalances: {
      sick: 12,
      casual: 12,
      vacation: 21,
      academic: 5
    }
  });
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchManagers();
      if (user) {
        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          password: "",
          role: user.role || "EMPLOYEE",
          department: user.department || "",
          managerId: user.managerId?._id || "none", // Changed from empty string to "none"
          isActive: user.isActive ?? true,
          leaveBalances: user.leaveBalances || {
            sick: 12,
            casual: 12,
            vacation: 21,
            academic: 5
          }
        });
      } else {
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          role: "EMPLOYEE",
          department: "",
          managerId: "none", // Changed from empty string to "none"
          isActive: true,
          leaveBalances: {
            sick: 12,
            casual: 12,
            vacation: 21,
            academic: 5
          }
        });
      }
    }
  }, [isOpen, user]);

  const fetchManagers = async () => {
    try {
      const response = await apiClient.getManagers();
      setManagers(response.data);
    } catch (error) {
      console.error('Failed to fetch managers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        managerId: formData.managerId === "none" ? undefined : formData.managerId // Convert "none" back to undefined
      };

      if (user) {
        await apiClient.updateUser(user._id, submitData);
        toast.success("User updated successfully");
      } else {
        await apiClient.createUser(submitData);
        toast.success("User created successfully");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Create User"}</DialogTitle>
          <DialogDescription>
            {user ? "Update user information" : "Add a new user to the system"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          {!user && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="managerId">Manager</Label>
            <Select value={formData.managerId} onValueChange={(value) => setFormData({ ...formData, managerId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Manager</SelectItem>
                {managers.map((manager: any) => (
                  <SelectItem key={manager._id} value={manager._id}>
                    {manager.firstName} {manager.lastName} ({manager.employeeId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Leave Balances</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sick">Sick Leave</Label>
                <Input
                  id="sick"
                  type="number"
                  min="0"
                  value={formData.leaveBalances.sick}
                  onChange={(e) => setFormData({
                    ...formData,
                    leaveBalances: { ...formData.leaveBalances, sick: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="casual">Casual Leave</Label>
                <Input
                  id="casual"
                  type="number"
                  min="0"
                  value={formData.leaveBalances.casual}
                  onChange={(e) => setFormData({
                    ...formData,
                    leaveBalances: { ...formData.leaveBalances, casual: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vacation">Vacation Leave</Label>
                <Input
                  id="vacation"
                  type="number"
                  min="0"
                  value={formData.leaveBalances.vacation}
                  onChange={(e) => setFormData({
                    ...formData,
                    leaveBalances: { ...formData.leaveBalances, vacation: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="academic">Academic Leave</Label>
                <Input
                  id="academic"
                  type="number"
                  min="0"
                  value={formData.leaveBalances.academic}
                  onChange={(e) => setFormData({
                    ...formData,
                    leaveBalances: { ...formData.leaveBalances, academic: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="isActive">Active User</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : (user ? "Update" : "Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
