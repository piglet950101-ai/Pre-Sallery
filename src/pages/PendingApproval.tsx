import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ClockIcon, LogOutIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PendingApproval = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error?.message || t('common.unexpectedError'),
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant border-0">
        <CardHeader className="text-center">
          <div className="mx-auto bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <ClockIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">{t('pendingApproval.title')}</CardTitle>
          <CardDescription className="text-base mt-2">
            {t('pendingApproval.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/20 border border-muted/30 p-5 rounded-lg space-y-3">
            <h3 className="font-medium text-base">{t('pendingApproval.whatHappensNext')}</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start space-x-2">
                <span className="font-bold text-primary">1.</span>
                <span>{t('pendingApproval.step1')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-primary">2.</span>
                <span>{t('pendingApproval.step2')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-primary">3.</span>
                <span>{t('pendingApproval.step3')}</span>
              </li>
            </ul>
          </div>
          
          <div className="text-center text-muted-foreground">
            {t('pendingApproval.contactInfo')}
          </div>
          
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center space-x-2"
            onClick={handleSignOut}
          >
            <LogOutIcon className="h-4 w-4" />
            <span>{t('common.signOut')}</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;