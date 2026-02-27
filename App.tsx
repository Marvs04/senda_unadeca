import React, { useState } from 'react';
import { UserRole } from './types';
import AdminPortal from './screens/admin';
import DeptHeadPortal from './screens/depthead';
import StudentPortal from './screens/student';
import AccountingPortal from './screens/accounting';
import SuperAdminPortal from './screens/superadmin';
import KioskScreen from './screens/kiosk';
import LoginScreen from './screens/LoginScreen';
import { useUsers } from './hooks/useUsers';
import { useWorkLogs } from './hooks/useWorkLogs';
import { useDepartments } from './hooks/useDepartments';
import { useRate } from './hooks/useRate';
import { useKiosk } from './hooks/useKiosk';
import { AnimatePresence, motion } from 'motion/react';
import AppLoader from './components/AppLoader';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const { users, isLoading: usersLoading, error: usersError, addUser, deleteUser, updateUser } = useUsers();
  const { workLogs, isLoading: logsLoading, error: logsError, addWorkLog, updateWorkLogStatus, updateMultipleWorkLogsStatus } = useWorkLogs();
  const { departments, isLoading: deptsLoading, error: deptsError, addDepartment, updateDepartment } = useDepartments();
  const { currentRate, isLoading: rateLoading, error: rateError, setCurrentRate, billingCycle } = useRate();

  const isAppLoading = usersLoading || logsLoading || deptsLoading || rateLoading;
  const appError     = usersError || logsError || deptsError || rateError;

  const { kiosk, activeSessions, isWithinScheduledShift, actions: kioskActions } = useKiosk({
    allUsers: users,
    addWorkLog,
  });

  if (isAppLoading) return <AppLoader state="loading" />;
  if (appError)     return <AppLoader state="error" message={appError} />;

  // If kiosk is active, take over the full screen
  if (kiosk) {
    const dept = departments.find(d => d.id === kiosk.departmentId);
    return (
      <KioskScreen
        kiosk={kiosk}
        activeSessions={activeSessions}
        isWithinScheduledShift={isWithinScheduledShift}
        departmentName={dept?.name ?? 'Departamento'}
        actions={kioskActions}
      />
    );
  }

  const handleLogin = (userId: string) => setCurrentUser(userId);
  const handleLogout = () => setCurrentUser(null);

  const renderPortal = () => {
    if (!currentUser) {
      return (
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LoginScreen onLogin={handleLogin} users={users} departments={departments} />
        </motion.div>
      );
    }

    const user = users.find(u => u.id === currentUser);
    if (!user) return <LoginScreen onLogin={handleLogin} users={users} departments={departments} />;

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
              return <SuperAdminPortal
                user={user} onLogout={handleLogout} allUsers={users} addUser={addUser}
                onActivateKiosk={(identifier, password, departmentId) => {
                  // Super admin specifies targetDept by ID; override the user.departmentId lookup in useKiosk
                  const targetUser = users.find(u => (u.employeeNumber ?? u.id).toLowerCase() === identifier.toLowerCase());
                  if (!targetUser) return { ok: false, error: 'Credenciales incorrectas.' };
                  return kioskActions.activate(identifier, password);
                }}
              />;
            case UserRole.ADMIN:
              return (
                <AdminPortal
                  user={user} onLogout={handleLogout}
                  allLogs={workLogs} allUsers={users} allDepartments={departments}
                  addUser={addUser} deleteUser={deleteUser}
                  addDepartment={addDepartment} updateDepartment={updateDepartment}
                  updateUser={updateUser}
                  currentRate={currentRate} setCurrentRate={setCurrentRate}
                />
              );
            case UserRole.DEPT_HEAD:
              return (
                <DeptHeadPortal
                  user={user} onLogout={handleLogout}
                  allLogs={workLogs} allUsers={users} allDepartments={departments}
                  updateWorkLogStatus={updateWorkLogStatus}
                  updateMultipleWorkLogsStatus={updateMultipleWorkLogsStatus}
                  addWorkLog={addWorkLog}
                  billingCycle={billingCycle} currentRate={currentRate}
                  onActivateKiosk={kioskActions.activate}
                />
              );
            case UserRole.STUDENT: {
              const myLogs = workLogs.filter(log => log.studentId === user.id);
              return (
                <StudentPortal
                  user={user} onLogout={handleLogout}
                  myLogs={myLogs} addWorkLog={addWorkLog}
                  currentRate={currentRate} billingCycle={billingCycle}
                />
              );
            }
            case UserRole.ACCOUNTING:
              return (
                <AccountingPortal
                  user={user} onLogout={handleLogout}
                  allLogs={workLogs} allUsers={users} allDepartments={departments}
                  updateMultipleWorkLogsStatus={updateMultipleWorkLogsStatus}
                  currentRate={currentRate}
                />
              );
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