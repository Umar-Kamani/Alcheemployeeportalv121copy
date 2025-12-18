import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { SecurityGuardDashboard } from './components/SecurityGuardDashboard';
import { HRDashboard } from './components/HRDashboard';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { DeanDashboard } from './components/DeanDashboard';
import { AuthAPI, UsersAPI, EmployeesAPI, AttendanceAPI, ParkingAPI, TokenManager } from './services/api';

// App version
export const APP_VERSION = '1.3.0'; // Updated version for PostgreSQL integration

export interface Employee {
  id: string;
  name: string;
  email?: string;
  defaultPlateNumber?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  timeIn: string;
  timeOut: string | null;
  plateNumber: string | null;
  isGuest: boolean;
}

export interface ParkingConfig {
  totalSpaces: number;
  occupiedSpaces: number;
}

export interface User {
  username: string;
  role: 'security' | 'hr' | 'superadmin' | 'dean' | 'admin';
  password?: string;
  id?: string;
}

export interface AccessLog {
  id: string;
  userId: string;
  username: string;
  action: 'login' | 'logout';
  timestamp: string;
}

export interface UserLog {
  id: string;
  userId: string;
  username: string;
  role: string;
  action: string;
  details: string;
  timestamp: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [parkingConfig, setParkingConfig] = useState<ParkingConfig>({ totalSpaces: 50, occupiedSpaces: 0 });
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [userLogs, setUserLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transform backend data to frontend format
  const transformEmployee = (dbEmployee: any): Employee => ({
    id: dbEmployee.id.toString(),
    name: dbEmployee.name,
    email: dbEmployee.employee_id,
    defaultPlateNumber: dbEmployee.vehicle_plate_number,
  });

  const transformAttendance = (dbRecord: any): AttendanceRecord => ({
    id: dbRecord.id.toString(),
    employeeId: dbRecord.employee_id ? dbRecord.employee_id.toString() : '',
    employeeName: dbRecord.employee_name,
    date: dbRecord.date,
    timeIn: dbRecord.time_in,
    timeOut: dbRecord.time_out,
    plateNumber: dbRecord.plate_number,
    isGuest: dbRecord.is_guest || false,
  });

  const transformUser = (dbUser: any): User => ({
    id: dbUser.id.toString(),
    username: dbUser.username,
    role: dbUser.role === 'admin' ? 'superadmin' : dbUser.role,
  });

  // Load all data from backend
  const loadAllData = async (userRole?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load users only if the user is a superadmin
      if (userRole === 'superadmin' || userRole === 'admin') {
        const usersData = await UsersAPI.getAll();
        setUsers(usersData.map(transformUser));
      }

      // Load employees
      const employeesData = await EmployeesAPI.getAll();
      setEmployees(employeesData.map(transformEmployee));

      // Load attendance records
      const attendanceData = await AttendanceAPI.getAll();
      setAttendanceRecords(attendanceData.map(transformAttendance));

      // Load parking config
      const parkingData = await ParkingAPI.getConfig();
      setParkingConfig({
        totalSpaces: parkingData.total_spaces,
        occupiedSpaces: parkingData.occupied_spaces,
      });

      setLoading(false);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Failed to load data from server');
      setLoading(false);
    }
  };

  // Check if user is logged in on mount
  useEffect(() => {
    const token = TokenManager.getToken();
    const savedUser = localStorage.getItem('currentUser');
    
    if (token && savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      loadAllData(user.role);
    } else {
      setLoading(false);
    }

    // Load access logs and user logs from localStorage (these are not yet in DB)
    const savedAccessLogs = localStorage.getItem('accessLogs');
    const savedUserLogs = localStorage.getItem('userLogs');
    if (savedAccessLogs) setAccessLogs(JSON.parse(savedAccessLogs));
    if (savedUserLogs) setUserLogs(JSON.parse(savedUserLogs));
  }, []);

  // Save logs to localStorage (temporary until migrated to DB)
  useEffect(() => {
    localStorage.setItem('accessLogs', JSON.stringify(accessLogs));
  }, [accessLogs]);

  useEffect(() => {
    localStorage.setItem('userLogs', JSON.stringify(userLogs));
  }, [userLogs]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    const newLog: AccessLog = {
      id: Date.now().toString(),
      userId: user.id!,
      username: user.username,
      action: 'login',
      timestamp: new Date().toISOString(),
    };
    setAccessLogs([...accessLogs, newLog]);

    // Load all data after successful login
    await loadAllData(user.role);
  };

  const handleLogout = () => {
    if (currentUser) {
      const newLog: AccessLog = {
        id: Date.now().toString(),
        userId: currentUser.id!,
        username: currentUser.username,
        action: 'logout',
        timestamp: new Date().toISOString(),
      };
      setAccessLogs([...accessLogs, newLog]);
    }
    AuthAPI.logout();
    setCurrentUser(null);
  };

  const addEmployee = async (employee: Employee) => {
    try {
      const newEmployee = await EmployeesAPI.create({
        name: employee.name,
        employee_id: employee.email || '',
        department: 'General', // Default department
        position: 'Staff', // Default position
        vehicle_plate_number: employee.defaultPlateNumber,
      });
      setEmployees([...employees, transformEmployee(newEmployee)]);
    } catch (err: any) {
      console.error('Failed to add employee:', err);
      throw err;
    }
  };

  const addEmployees = async (newEmployees: Employee[]) => {
    try {
      const createdEmployees = await Promise.all(
        newEmployees.map(emp =>
          EmployeesAPI.create({
            name: emp.name,
            employee_id: emp.email || '',
            department: 'General',
            position: 'Staff',
            vehicle_plate_number: emp.defaultPlateNumber,
          })
        )
      );
      setEmployees([...employees, ...createdEmployees.map(transformEmployee)]);
    } catch (err: any) {
      console.error('Failed to add employees:', err);
      throw err;
    }
  };

  const deleteEmployee = async (employeeId: string) => {
    try {
      await EmployeesAPI.delete(parseInt(employeeId));
      setEmployees(employees.filter(e => e.id !== employeeId));
    } catch (err: any) {
      console.error('Failed to delete employee:', err);
      throw err;
    }
  };

  const updateEmployee = async (updatedEmployee: Employee) => {
    try {
      const updated = await EmployeesAPI.update(parseInt(updatedEmployee.id), {
        name: updatedEmployee.name,
        employee_id: updatedEmployee.email || '',
        department: 'General',
        position: 'Staff',
        vehicle_plate_number: updatedEmployee.defaultPlateNumber,
      });
      setEmployees(employees.map(e => (e.id === updatedEmployee.id ? transformEmployee(updated) : e)));
    } catch (err: any) {
      console.error('Failed to update employee:', err);
      throw err;
    }
  };

  const addUser = async (user: User) => {
    try {
      const newUser = await UsersAPI.create({
        username: user.username,
        password: user.password || 'default123',
        role: user.role === 'superadmin' ? 'admin' : user.role,
      });
      setUsers([...users, transformUser(newUser)]);
    } catch (err: any) {
      console.error('Failed to add user:', err);
      throw err;
    }
  };

  const updateUser = async (updatedUser: User) => {
    try {
      await UsersAPI.resetPassword(parseInt(updatedUser.id!), updatedUser.password || 'default123');
      setUsers(users.map(u => (u.id === updatedUser.id ? updatedUser : u)));
      if (currentUser?.id === updatedUser.id) {
        setCurrentUser(updatedUser);
      }
    } catch (err: any) {
      console.error('Failed to update user:', err);
      throw err;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await UsersAPI.delete(parseInt(userId));
      setUsers(users.filter(u => u.id !== userId));
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      throw err;
    }
  };

  const updateAttendance = async (record: AttendanceRecord) => {
    try {
      const existingRecord = attendanceRecords.find(r => r.id === record.id);
      
      if (existingRecord && existingRecord.timeOut === null && record.timeOut !== null) {
        // Marking exit
        await AttendanceAPI.markExit(parseInt(record.id), record.timeOut);
        setAttendanceRecords(attendanceRecords.map(r => (r.id === record.id ? record : r)));
      } else if (!existingRecord) {
        // New entry
        const employee = employees.find(e => e.name === record.employeeName);
        const newRecord = await AttendanceAPI.markEntry({
          employee_id: employee ? parseInt(employee.id) : undefined,
          employee_name: record.employeeName,
          date: record.date,
          time_in: record.timeIn,
          plate_number: record.plateNumber,
          is_guest: record.isGuest,
        });
        setAttendanceRecords([...attendanceRecords, transformAttendance(newRecord)]);
      }
    } catch (err: any) {
      console.error('Failed to update attendance:', err);
      throw err;
    }
  };

  const deleteAttendanceRecord = async (id: string) => {
    try {
      const recordToDelete = attendanceRecords.find(r => r.id === id);
      
      // If the record has a plate number and hasn't exited, free up parking space
      if (recordToDelete && recordToDelete.plateNumber && recordToDelete.timeOut === null) {
        const newOccupied = Math.max(0, parkingConfig.occupiedSpaces - 1);
        await ParkingAPI.updateConfig({
          total_spaces: parkingConfig.totalSpaces,
          occupied_spaces: newOccupied,
        });
        setParkingConfig({
          ...parkingConfig,
          occupiedSpaces: newOccupied,
        });
      }
      
      await AttendanceAPI.delete(parseInt(id));
      setAttendanceRecords(attendanceRecords.filter(r => r.id !== id));
    } catch (err: any) {
      console.error('Failed to delete attendance record:', err);
      throw err;
    }
  };

  const updateParkingConfig = async (config: ParkingConfig) => {
    try {
      await ParkingAPI.updateConfig({
        total_spaces: config.totalSpaces,
        occupied_spaces: config.occupiedSpaces,
      });
      setParkingConfig(config);
    } catch (err: any) {
      console.error('Failed to update parking config:', err);
      throw err;
    }
  };

  const addLog = (action: string, details: string) => {
    if (currentUser) {
      const newLog: UserLog = {
        id: Date.now().toString() + Math.random(),
        userId: currentUser.id!,
        username: currentUser.username,
        role: currentUser.role,
        action,
        details,
        timestamp: new Date().toISOString(),
      };
      setUserLogs([...userLogs, newLog]);
    }
  };

  const addEmployeeWithLog = async (employee: Employee) => {
    await addEmployee(employee);
    addLog('Create Employee', `Created employee: ${employee.name}`);
  };

  const addEmployeesWithLog = async (newEmployees: Employee[]) => {
    await addEmployees(newEmployees);
    addLog('Bulk Import', `Imported ${newEmployees.length} employees`);
  };

  const deleteEmployeeWithLog = async (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    await deleteEmployee(employeeId);
    if (emp) {
      addLog('Delete Employee', `Deleted employee: ${emp.name}`);
    }
  };

  const updateEmployeeWithLog = async (updatedEmployee: Employee) => {
    await updateEmployee(updatedEmployee);
    addLog('Update Employee', `Updated employee: ${updatedEmployee.name}`);
  };

  const addUserWithLog = async (user: User) => {
    await addUser(user);
    addLog('Create User', `Created ${user.role} user: ${user.username}`);
  };

  const updateUserWithLog = async (updatedUser: User) => {
    await updateUser(updatedUser);
    addLog('Reset Password', `Reset password for user: ${updatedUser.username}`);
  };

  const deleteUserWithLog = async (userId: string) => {
    const usr = users.find(u => u.id === userId);
    await deleteUser(userId);
    if (usr) {
      addLog('Delete User', `Deleted user: ${usr.username} (${usr.role})`);
    }
  };

  const updateAttendanceWithLog = async (record: AttendanceRecord) => {
    const existingRecord = attendanceRecords.find(r => r.id === record.id);
    await updateAttendance(record);

    if (existingRecord) {
      if (existingRecord.timeOut === null && record.timeOut !== null) {
        addLog('Mark Exit', `Marked exit for ${record.isGuest ? 'guest' : 'staff'}: ${record.employeeName}`);
      } else if (!existingRecord.timeOut && !record.timeOut) {
        addLog('Update Attendance', `Updated attendance record for: ${record.employeeName}`);
      }
    } else {
      addLog('Mark Entry', `Marked entry for ${record.isGuest ? 'guest' : 'staff'}: ${record.employeeName}`);
    }
  };

  const deleteAttendanceRecordWithLog = async (id: string) => {
    const record = attendanceRecords.find(r => r.id === id);
    await deleteAttendanceRecord(id);
    if (record) {
      addLog('Delete Attendance', `Deleted attendance record for: ${record.employeeName} (${record.date})`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#002E6D]">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#002E6D]">
        <div className="text-white text-center max-w-md p-6">
          <h2 className="text-2xl mb-4">Connection Error</h2>
          <p className="mb-4">{error}</p>
          <p className="text-sm opacity-80">Please check if the backend server is running.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#BF2C34] rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} users={users} />;
  }

  if (currentUser.role === 'superadmin' || currentUser.role === 'admin') {
    return (
      <SuperAdminDashboard
        user={currentUser}
        users={users}
        employees={employees}
        attendanceRecords={attendanceRecords}
        parkingConfig={parkingConfig}
        accessLogs={accessLogs}
        userLogs={userLogs}
        onLogout={handleLogout}
        onAddUser={addUserWithLog}
        onUpdateUser={updateUserWithLog}
        onDeleteUser={deleteUserWithLog}
      />
    );
  }

  if (currentUser.role === 'security') {
    return (
      <SecurityGuardDashboard
        user={currentUser}
        employees={employees}
        attendanceRecords={attendanceRecords}
        parkingConfig={parkingConfig}
        onLogout={handleLogout}
        onUpdateAttendance={updateAttendanceWithLog}
        onUpdateParkingConfig={updateParkingConfig}
      />
    );
  }

  if (currentUser.role === 'dean') {
    return (
      <DeanDashboard
        user={currentUser}
        employees={employees}
        attendanceRecords={attendanceRecords}
        parkingConfig={parkingConfig}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <HRDashboard
      user={currentUser}
      employees={employees}
      attendanceRecords={attendanceRecords}
      parkingConfig={parkingConfig}
      onLogout={handleLogout}
      onAddEmployee={addEmployeeWithLog}
      onAddEmployees={addEmployeesWithLog}
      onDeleteEmployee={deleteEmployeeWithLog}
      onUpdateEmployee={updateEmployeeWithLog}
      onUpdateAttendance={updateAttendanceWithLog}
      onDeleteAttendance={deleteAttendanceRecordWithLog}
      onUpdateParkingConfig={updateParkingConfig}
    />
  );
}
