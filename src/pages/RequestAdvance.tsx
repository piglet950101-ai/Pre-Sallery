import { Button } from "@/components/ui/button";
import { AdvanceRequestForm } from "@/components/AdvanceRequestForm";
import { ArrowLeft, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const RequestAdvance = () => {
  const { t } = useLanguage();
  
  // Mock employee data - in real app this would come from auth/API
  const employeeData = {
    name: "María González",
    monthlySalary: 800,
    workedDays: 12,
    totalDays: 22,
    earnedAmount: 436.36,
    availableAmount: 349.09, // 80% of earned
    usedAmount: 150,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/employee" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>{t('common.back') || 'Back'}</span>
                </Link>
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{t('employee.requestAdvance')}</h1>
                  <p className="text-sm text-muted-foreground">{t('employee.requestDescription')}</p>
                </div>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/">{t('nav.logout')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <AdvanceRequestForm employeeData={employeeData} />
        </div>
      </div>
    </div>
  );
};

export default RequestAdvance;