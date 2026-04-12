import React, { useEffect, useState, Suspense, lazy } from 'react';
import { UserRole } from './types';

// Code splitting: cada portal solo se descarga cuando el usuario lo necesita
const AdminPortal      = lazy(() => import('./screens/admin'));
const DeptHeadPortal   = lazy(() => import('./screens/depthead'));
const StudentPortal    = lazy(() => import('./screens/student'));
const AccountingPortal = lazy(() => import('./screens/accounting'));
const SuperAdminPortal = lazy(() => import('./screens/superadmin'));
const KioskScreen      = lazy(() => import('./screens/kiosk'));
const LoginScreen      = lazy(() => import('./screens/LoginScreen'));
import { useUsers } from './hooks/useUsers';
import { useWorkLogs } from './hooks/useWorkLogs';
import { useDepartments } from './hooks/useDepartments';
import { useRate } from './hooks/useRate';
import { useKiosk } from './hooks/useKiosk';
import { AnimatePresence, motion } from 'motion/react';
import AppLoader from './components/AppLoader';
import { getSessionProfile, login, logout } from './services';

interface AuthenticatedAreaProps {
  currentUserId: string;
  onLogout: () => void;
}

const AuthenticatedArea: React.FC<AuthenticatedAreaProps> = ({ currentUserId, onLogout }) => {

  const {
    users,
    isLoading: usersLoading,
    error: usersError,
    addUser,
    deleteUser,
    updateUser,
    resetUserPassword,
  } = useUsers();
  const { workLogs, isLoading: logsLoading, error: logsError, addWorkLog, updateWorkLogStatus, updateMultipleWorkLogsStatus } = useWorkLogs();
  const { departments, isLoading: deptsLoading, error: deptsError, addDepartment, updateDepartment, deleteDepartment } = useDepartments();
  const { currentRate, isLoading: rateLoading, error: rateError, setCurrentRate, billingCycle } = useRate();

  const isAppLoading = usersLoading || logsLoading || deptsLoading || rateLoading;
  const appError = usersError || logsError || deptsError || rateError;

  const {
    kiosk,
    activeSessions,
    isWithinScheduledShift,
    actions: kioskActions,
  } = useKiosk();

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

  const user = users.find(u => u.id === currentUserId);
  if (!user) {
    return <AppLoader state="error" message="No se encontró el perfil del usuario autenticado." />;
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
            return (
              <SuperAdminPortal
                user={user}
                onLogout={onLogout}
                allUsers={users}
                allDepartments={departments}
                addUser={addUser}
                onActivateKiosk={(identifier, password, departmentId) => {
                  return kioskActions.activate(identifier, password, departmentId);
                }}
                resetUserPassword={resetUserPassword}
              />
            );
          case UserRole.ADMIN:
            return (
              <AdminPortal
                user={user}
                onLogout={onLogout}
                allLogs={workLogs}
                allUsers={users}
                allDepartments={departments}
                addUser={addUser}
                deleteUser={deleteUser}
                addDepartment={addDepartment}
                updateDepartment={updateDepartment}
                deleteDepartment={deleteDepartment}
                updateUser={updateUser}
                currentRate={currentRate}
                setCurrentRate={setCurrentRate}
              />
            );
          case UserRole.DEPT_HEAD:
            return (
              <DeptHeadPortal
                user={user}
                onLogout={onLogout}
                allLogs={workLogs}
                allUsers={users}
                allDepartments={departments}
                updateWorkLogStatus={updateWorkLogStatus}
                updateMultipleWorkLogsStatus={updateMultipleWorkLogsStatus}
                addWorkLog={addWorkLog}
                billingCycle={billingCycle}
                currentRate={currentRate}
                onActivateKiosk={kioskActions.activate}
              />
            );
          case UserRole.STUDENT: {
            const myLogs = workLogs.filter(log => log.studentId === user.id);
            return (
              <StudentPortal
                user={user}
                onLogout={onLogout}
                myLogs={myLogs}
                addWorkLog={addWorkLog}
                currentRate={currentRate}
                billingCycle={billingCycle}
              />
            );
          }
          case UserRole.ACCOUNTING:
            return (
              <AccountingPortal
                user={user}
                onLogout={onLogout}
                allDepartments={departments}
                updateMultipleWorkLogsStatus={updateMultipleWorkLogsStatus}
                currentRate={currentRate}
              />
            );
          default:
            return null;
        }
      })()}
    </motion.div>
  );
};

const App: React.FC = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getSessionProfile()
      .then(profile => {
        if (!mounted) return;
        setCurrentUserId(profile?.id ?? null);
      })
      .catch((error: unknown) => {
        if (!mounted) return;
        setAuthError(error instanceof Error ? error.message : 'Error de autenticación.');
      })
      .finally(() => {
        if (mounted) setIsBooting(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = async (identifier: string, password: string) => {
    const profile = await login(identifier, password);
    setCurrentUserId(profile.id);
    setAuthError(null);
  };

  const handleLogout = () => {
    logout()
      .catch(() => { /* token already cleared by logout() finally block */ })
      .finally(() => {
        setCurrentUserId(null);
        setAuthError(null);
      });
  };

  if (isBooting) return <AppLoader state="loading" />;
  if (authError) return <AppLoader state="error" message={authError} />;

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<AppLoader state="loading" />}>
        <AnimatePresence mode="wait">
          {currentUserId ? (
            <AuthenticatedArea currentUserId={currentUserId} onLogout={handleLogout} />
          ) : (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoginScreen onLogin={handleLogin} />
            </motion.div>
          )}
        </AnimatePresence>
      </Suspense>
    </div>
  );
};

export default App;