import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    // If the user arrives from email link, Supabase will set a session
    // We could optionally verify here.
  }, []);

  const handleUpdate = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: t('resetPassword.passwordUpdated') });
      navigate("/login");
    } catch (err: any) {
      toast({ title: t('forgotPassword.error'), description: err?.message ?? t('forgotPassword.tryAgain') });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <Card className="w-full max-w-md shadow-elegant border-0">
        <CardHeader>
          <CardTitle>{t('resetPassword.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t('resetPassword.newPassword')}</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button className="w-full" disabled={isLoading} onClick={handleUpdate}>
            {t('resetPassword.update')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;


