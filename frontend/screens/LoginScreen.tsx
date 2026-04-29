import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
    Lock,
    ArrowRight,
    User as UserIcon,
    Key,
    Eye,
    EyeOff,
    Clock,
} from 'lucide-react';

interface LoginScreenProps {
    onLogin: (identifier: string, password: string) => Promise<void>;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
        setErrorMessage(null);
        if (!username || !password || isSubmitting) return;

        try {
            setIsSubmitting(true);
            await onLogin(username.trim(), password);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Credenciales inválidas.');
        } finally {
            setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start lg:justify-center p-4 sm:p-6 selection:bg-primary selection:text-primary-fg">
      {/* Mobile Logo - Only on mobile */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:hidden mt-4 mb-6"
      >
        <img 
          src={`${import.meta.env.BASE_URL}send_logo_login.png`}
          alt="SENDA Logo"
          className="w-16 h-16 object-contain"
        />
      </motion.div>

      <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-end lg:items-end">

        {/* Left Side: Branding & Info - Desktop only */}
                <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hidden lg:flex lg:flex-col lg:justify-between space-y-12"
        >
                    <div className="space-y-6">
                        <div className="flex flex-col items-center gap-6">
                            <img 
                                src={`${import.meta.env.BASE_URL}send_logo_login.png`}
                                alt="SENDA Logo"
                                className="w-48 h-48 object-contain"
                            />
                            <h1 className="text-8xl font-black tracking-tighter text-foreground font-display leading-[0.9] text-center">
                                SENDA
                            </h1>
                        </div>
                        <p className="text-muted text-xl font-medium max-w-md leading-relaxed text-center">
                            Sistema Estratégico de Normalización y Desarrollo Académico.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="relative p-8 bg-card rounded-[2.5rem] border border-border-faint shadow-sm overflow-hidden">
                            <div className="absolute -right-8 -top-8 opacity-10">
                                <Lock className="w-40 h-40 text-foreground" />
                            </div>
                            <div className="relative z-10">
                                <h4 className="font-bold mb-2">Seguridad</h4>
                                <p className="text-xs text-faint leading-relaxed">Acceso encriptado y validación institucional de credenciales.</p>
                            </div>
                        </div>
                        <div className="relative p-8 bg-card rounded-[2.5rem] border border-border-faint shadow-sm overflow-hidden">
                            <div className="absolute -right-8 -top-8 opacity-10">
                                <Clock className="w-40 h-40 text-foreground" />
                            </div>
                            <div className="relative z-10">
                                <h4 className="font-bold mb-2">Eficiencia</h4>
                                <p className="text-xs text-faint leading-relaxed">Automatización de procesos administrativos y financieros.</p>
                            </div>
                        </div>
                    </div>
        </motion.div>

                {/* Right Side: Login Form */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-card p-12 rounded-[3.5rem] border border-border-faint shadow-2xl shadow-border/50 w-full max-w-md mx-auto"
                >
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-black tracking-tight mb-2">Iniciar Sesión</h2>
                        <p className="text-sm text-faint font-medium">Ingresa tus credenciales institucionales</p>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-faint ml-4">Usuario / Carnet</label>
                            <div className="relative">
                                <UserIcon className="w-4 h-4 absolute left-6 top-1/2 -translate-y-1/2 text-faint" />
                                <input
                                    type="text"
                                    autoComplete="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Ej. 20240101"
                                    className="w-full bg-surface border-none rounded-[2rem] py-5 pl-14 pr-6 text-sm font-bold focus:ring-2 focus:ring-primary/5 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-faint ml-4">Contraseña</label>
                            <div className="relative">
                                <Key className="w-4 h-4 absolute left-6 top-1/2 -translate-y-1/2 text-faint" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-surface border-none rounded-[2rem] py-5 pl-14 pr-14 text-sm font-bold focus:ring-2 focus:ring-primary/5 transition-all"
                                />
                                <button
                                    type="button"
                                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-faint hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-primary text-primary-fg font-black py-6 rounded-[2rem] shadow-xl shadow-primary/20 hover:bg-primary-hover transition-all active:scale-[0.98] flex items-center justify-center space-x-3"
                        >
                            <span>{isSubmitting ? 'Validando...' : 'Entrar al Sistema'}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>

                        {errorMessage && (
                            <p className="text-xs text-rose-500 text-center">{errorMessage}</p>
                        )}
                    </form>
                </motion.div>
      </div>

      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 lg:mt-24 flex flex-col items-center space-y-4"
      >
        <div className="h-px w-12 bg-border" />
        <p className="text-faint text-[10px] font-bold uppercase tracking-[0.3em]">
          &copy; {new Date().getFullYear()} SENDA &bull; UNADECA
        </p>
      </motion.footer>
    </div>
  );
};

export default LoginScreen;
