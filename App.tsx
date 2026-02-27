import React, { useState } from 'react';
import { UserRole, WorkLog, WorkLogStatus, User, Department } from './types';
import AdminPortal from './screens/AdminPortal';
import DeptHeadPortal from './screens/DeptHeadPortal';
import StudentPortal from './screens/StudentPortal';
import AccountingPortal from './screens/AccountingPortal';
import SuperAdminPortal from './screens/SuperAdminPortal';
import LoginScreen from './screens/LoginScreen';
import { HOURLY_RATE, TITHE_PERCENTAGE, MOCK_USERS, MOCK_WORK_LOGS, MOCK_DEPARTMENTS } from './constants';
import { getBillingCycle } from './lib/utils';

import { AnimatePresence, motion } from 'motion/react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>(MOCK_WORK_LOGS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [departments, setDepartments] = useState<Department[]>(MOCK_DEPARTMENTS);
  const [currentRate, setCurrentRate] = useState(HOURLY_RATE);
  const [billingCycle, setBillingCycle] = useState(getBillingCycle().value);

  const handleLogin = (userId: string) => {
    setCurrentUser(userId);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const addWorkLog = (newLogData: Omit<WorkLog, 'id' | 'status'>, status: WorkLogStatus = WorkLogStatus.PENDING) => {
    const newLog: WorkLog = {
      ...newLogData,
      id: `log-${Date.now()}-${Math.random()}`,
      status,
    };
    setWorkLogs(prev => [newLog, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };
  
  const addUser = (newUser: Omit<User, 'id'>) => {
    const user: User = { ...newUser, id: `user-${Date.now()}` };
    setUsers(prev => [...prev, user]);
  };
  
  const addDepartment = (newDepartment: Omit<Department, 'id'>) => {
    const department: Department = { ...newDepartment, id: `dept-${Date.now()}`};
    setDepartments(prev => [...prev, department]);
  };

  const updateDepartment = (deptId: string, updates: Partial<Department>) => {
    setDepartments(prev => prev.map(d => d.id === deptId ? { ...d, ...updates } : d));
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const updateWorkLogStatus = (logId: string, newStatus: WorkLogStatus, reason?: string) => {
    setWorkLogs(prev => prev.map(log => log.id === logId ? { ...log, status: newStatus, rejectionReason: reason } : log));
  };
  
  const updateMultipleWorkLogsStatus = (updates: { logId: string, status: WorkLogStatus }[]) => {
      setWorkLogs(prev => {
          const updatesMap = new Map(updates.map(u => [u.logId, u.status]));
          return prev.map(log => updatesMap.has(log.id) ? { ...log, status: updatesMap.get(log.id)! } : log);
      });
  };


  const renderPortal = () => {
    if (!currentUser) {
      return (
        <motion.div 
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <LoginScreen onLogin={handleLogin} users={users} departments={departments} />
        </motion.div>
      );
    }

    const user = users.find(u => u.id === currentUser);
    if (!user) {
        return <LoginScreen onLogin={handleLogin} users={users} departments={departments} />;
    }

    return (
      <motion.div 
        key={user.role}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        {(() => {
          switch (user.role) {
            case UserRole.SUPER_ADMIN:
              return <SuperAdminPortal user={user} onLogout={handleLogout} allUsers={users} addUser={addUser} />;
            case UserRole.ADMIN:
              return <AdminPortal user={user} onLogout={handleLogout} allLogs={workLogs} allUsers={users} allDepartments={departments} addUser={addUser} deleteUser={deleteUser} addDepartment={addDepartment} updateDepartment={updateDepartment} updateUser={updateUser} currentRate={currentRate} setCurrentRate={setCurrentRate} />;
            case UserRole.DEPT_HEAD:
              return <DeptHeadPortal user={user} onLogout={handleLogout} allLogs={workLogs} updateWorkLogStatus={updateWorkLogStatus} updateMultipleWorkLogsStatus={updateMultipleWorkLogsStatus} addWorkLog={addWorkLog} allUsers={users} allDepartments={departments} billingCycle={billingCycle} currentRate={currentRate} />;
            case UserRole.STUDENT:
              const myLogs = workLogs.filter(log => log.studentId === user.id);
              return <StudentPortal user={user} onLogout={handleLogout} myLogs={myLogs} addWorkLog={addWorkLog} currentRate={currentRate} billingCycle={billingCycle} />;
            case UserRole.ACCOUNTING:
              return <AccountingPortal user={user} onLogout={handleLogout} allLogs={workLogs} allUsers={users} allDepartments={departments} updateMultipleWorkLogsStatus={updateMultipleWorkLogsStatus} currentRate={currentRate} />;
            default:
              return <LoginScreen onLogin={handleLogin} users={users} departments={departments} />;
          }
        })()}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <AnimatePresence mode="wait">
        {renderPortal()}
      </AnimatePresence>
    </div>
  );
};

export default App;