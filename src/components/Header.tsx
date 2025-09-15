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
  Settings
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth, getUserRole, getActualUserRole } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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

  // Get actual user role from database
  useEffect(() => {
    const fetchActualRole = async () => {
      if (user && !isLoading) {
        setIsCheckingRole(true);
        try {
          const roleFromDb = await getActualUserRole(user.id);
          setActualUserRole(roleFromDb);
        } catch (error) {
          console.error("Error fetching actual user role:", error);
        } finally {
          setIsCheckingRole(false);
        }
      }
    };

    fetchActualRole();
  }, [user, isLoading]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
    setIsMobileMenuOpen(false);
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
            
            {/* Operator Panel Button - always visible for logged in users */}
            <Link 
              to="/operator" 
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-2"
            >
              <Shield className="h-4 w-4" />
              <span>{t('nav.operatorPanel') ?? 'Operator Panel'}</span>
            </Link>
            
            {/* Role-specific navigation items */}
            {actualUserRole === 'employee' && (
              <Link 
                to="/employee/request-advance" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('employee.requestAdvance') ?? 'Request Advance'}
              </Link>
            )}
            
            {actualUserRole === 'company' && (
              <Link 
                to="/company/configuration" 
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>{t('company.configuration') ?? 'Configuration'}</span>
              </Link>
            )}
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
                    {user?.email?.split('@')[0] || 'User'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{user?.email?.split('@')[0] || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">{getRoleDisplayName(actualUserRole)}</p>
                </div>
                <DropdownMenuSeparator />
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
