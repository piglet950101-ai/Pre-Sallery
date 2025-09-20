import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  DollarSign, 
  User, 
  Building, 
  Shield, 
  LogOut, 
  Settings,
  UserCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth, getUserRole, getActualUserRole } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { log } from "console";

interface HeaderProps {
  showNavigation?: boolean;
  className?: string;
}

const Header = ({ showNavigation = true, className = "" }: HeaderProps) => {
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [actualUserRole, setActualUserRole] = useState<string | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [employeeName, setEmployeeName] = useState<string | null>(null);

  // Get actual user role and employee name from database
  useEffect(() => {
    const fetchUserData = async () => {
      if (user && !isLoading) {
        setIsCheckingRole(true);
        try {
          const roleFromDb = await getActualUserRole(user.id);
          setActualUserRole(roleFromDb);
          
          // If user is an employee, fetch their name
          if (roleFromDb === 'employee') {
            const { data: employee, error } = await supabase
              .from('employees')
              .select('first_name, last_name')
              .eq('auth_user_id', user.id)
              .single();
            
            if (employee && !error) {
              setEmployeeName(`${employee.first_name} ${employee.last_name}`);
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setIsCheckingRole(false);
        }
      }
    };

    fetchUserData();
  }, [user, isLoading]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const handleProfile = () => {
    // Navigate to profile page based on user role
    if (actualUserRole === 'employee') {
      navigate('/profile');
    } else if (actualUserRole === 'company') {
      navigate('/company');
    } else if (actualUserRole === 'operator') {
      navigate('/operator');
    }
  };

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'employee':
        return <User className="h-4 w-4" />;
      case 'company':
        return <Building className="h-4 w-4" />;
      case 'operator':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleDisplayName = (role: string | null) => {
    switch (role) {
      case 'employee':
        return t('nav.employeePanel') ?? 'Employee Panel';
      case 'company':
        return t('nav.companyPanel') ?? 'Company Panel';
      case 'operator':
        return t('nav.operatorPanel') ?? 'Operator Panel';
      default:
        return t('nav.dashboard') ?? 'Dashboard';
    }
  };



  // Show loading state
  if (isLoading || isCheckingRole) {
    return (
      <nav className={`border-b bg-background/95 backdrop-blur-md sticky top-0 z-50 shadow-sm ${className}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">AvancePay</span>
              <Badge variant="secondary" className="ml-2">Venezuela</Badge>
            </div>
            <div className="flex items-center space-x-3">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Not logged in - show public navigation
  if (!user) {
    return (
      <nav className={`border-b bg-background/95 backdrop-blur-md sticky top-0 z-50 shadow-sm ${className}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">AvancePay</span>
              <Badge variant="secondary" className="ml-2">Venezuela</Badge>
            </Link>
            
            {/* Desktop Navigation */}
            {showNavigation && (
              <div className="hidden md:flex items-center space-x-8">
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('nav.features')}
                </a>
                <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('nav.howItWorks')}
                </a>
                <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('nav.pricing')}
                </a>
                <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('nav.testimonials')}
                </a>
              </div>
            )}
            
            <div className="flex items-center space-x-3">
              <LanguageSwitcher />
              <Button variant="ghost" asChild>
                <Link to="/login">{t('nav.login')}</Link>
              </Button>
              <Button variant="premium" asChild>
                <Link to="/register">{t('nav.getStarted')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Logged in - show role-based navigation
  return (
    <nav className={`border-b bg-background/95 backdrop-blur-md sticky top-0 z-50 shadow-sm ${className}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-foreground">AvancePay</span>
              <Badge variant="secondary" className="ml-2">Venezuela</Badge>
            </div>
          </Link>
          
          {/* Desktop Navigation for logged in users */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Basic navigation menu - always visible */}
            <a href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.features')}
            </a>
            <a href="/#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.howItWorks')}
            </a>
            <a href="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.pricing')}
            </a>
            <a href="/#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.testimonials')}
            </a>
            
            {/* Role panel shortcut */}
            {actualUserRole === 'company' && (
              <Link 
                to="/company" 
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-2"
              >
                <Building className="h-4 w-4" />
                <span>{t('nav.companyPanel') ?? 'Company Panel'}</span>
              </Link>
            )}
            {actualUserRole === 'employee' && (
              <Link 
                to="/employee" 
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-2"
              >
                <User className="h-4 w-4" />
                <span>{t('nav.employeePanel') ?? 'Employee Panel'}</span>
              </Link>
            )}
            
            {/* Role-specific navigation items */}
          </div>
          
          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            <LanguageSwitcher />
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2">
                  {getRoleIcon(actualUserRole)}
                  <span className="hidden sm:inline-block">
                    {employeeName || user?.email?.split('@')[0] || 'User'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{employeeName || user?.email?.split('@')[0] || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">{getRoleDisplayName(actualUserRole)}</p>
                </div>
                <DropdownMenuSeparator />
                {actualUserRole === 'employee' && (
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{t('nav.profile') ?? 'Profile'}</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                {actualUserRole === 'company' && (
                  <DropdownMenuItem asChild>
                    <Link to="/company/configuration" className="flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>{t('company.configuration') ?? 'Configuration'}</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} className="flex items-center space-x-2 text-red-600">
                  <LogOut className="h-4 w-4" />
                  <span>{t('nav.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
