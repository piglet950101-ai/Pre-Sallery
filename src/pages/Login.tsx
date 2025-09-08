import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Building, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Login = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <Link to="/" className="flex items-center justify-center space-x-2">
            <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
              <DollarSign className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">AvancePay</span>
          </Link>
          <p className="text-muted-foreground">{t('login.subtitle')}</p>
        </div>

        <Card className="shadow-elegant border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">{t('login.title')}</CardTitle>
            <CardDescription className="text-center">
              {t('login.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="employee" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="employee" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{t('register.employee')}</span>
                </TabsTrigger>
                <TabsTrigger value="company" className="flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>{t('register.company')}</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="employee" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employee-email">{t('login.email')}</Label>
                  <Input
                    id="employee-email"
                    type="email"
                    placeholder="empleado@ejemplo.com"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee-password">{t('login.password')}</Label>
                  <Input
                    id="employee-password"
                    type="password"
                    className="h-12"
                  />
                </div>
                <Button className="w-full h-12" variant="premium" asChild>
                  <Link to="/employee">{t('login.submit')}</Link>
                </Button>
              </TabsContent>

              <TabsContent value="company" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-email">{t('login.email')}</Label>
                  <Input
                    id="company-email"
                    type="email"
                    placeholder="admin@empresa.com"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-password">{t('login.password')}</Label>
                  <Input
                    id="company-password"
                    type="password"
                    className="h-12"
                  />
                </div>
                <Button className="w-full h-12" variant="hero" asChild>
                  <Link to="/company">{t('login.submit')}</Link>
                </Button>
              </TabsContent>
            </Tabs>

            <div className="text-center space-y-2">
              <Button variant="link" className="text-sm">
                ¿Olvidaste tu contraseña?
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-muted-foreground">
            {t('login.noAccount')}{" "}
            <Button variant="link" className="p-0" asChild>
              <Link to="/register">{t('login.signUp')}</Link>
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;