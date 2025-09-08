import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { DollarSign, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <div className="text-center space-y-6">
        <Link to="/" className="flex items-center justify-center space-x-2 mb-8">
          <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
            <DollarSign className="h-7 w-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-foreground">AvancePay</span>
        </Link>
        
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <h2 className="text-3xl font-bold text-foreground">{t('notFound.title')}</h2>
          <p className="text-xl text-muted-foreground max-w-md">
            {t('notFound.subtitle')}
          </p>
        </div>
        
        <Button size="lg" variant="hero" asChild>
          <Link to="/" className="flex items-center space-x-2">
            <Home className="h-5 w-5" />
            <span>{t('notFound.backHome')}</span>
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;