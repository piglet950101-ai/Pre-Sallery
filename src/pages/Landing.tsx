import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Shield, 
  Users, 
  Zap,
  ArrowRight,
  Building2,
  Smartphone,
  TrendingUp,
  FileText,
  Star,
  Play,
  BarChart3,
  CreditCard,
  Banknote
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import heroBgVenezuela from "@/assets/hero-bg-venezuela.jpg";
import featuresBgPattern from "@/assets/features-bg-pattern.jpg";

const Landing = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">AvancePay</span>
              <Badge variant="secondary" className="ml-2">Venezuela</Badge>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.features')}</a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.howItWorks')}</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.pricing')}</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.testimonials')}</a>
            </div>
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

      {/* Hero Section */}
      <section className="relative py-24 px-4 bg-gradient-hero overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{ backgroundImage: `url(${heroBgVenezuela})` }}
        ></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto max-w-7xl relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-6">
                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                  {t('landing.badge')}
                </Badge>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                  {t('landing.heroTitle1')} 
                  <span className="block bg-gradient-primary bg-clip-text text-transparent">
                    {t('landing.heroTitle2')}
                  </span>
                  <span className="block text-4xl md:text-5xl lg:text-6xl">
                    {t('landing.heroTitle3')}
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground max-w-xl">
                  {t('landing.heroDescription').split('80%').map((part, index, arr) => (
                    index < arr.length - 1 ? (
                      <>
                        {part}
                        <span className="font-semibold text-primary">80%</span>
                      </>
                    ) : part
                  ))}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="hero" className="text-lg px-8 py-6 group" asChild>
                  <Link to="/register">
                    {t('landing.startFree30')}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
                  <Link to="/demo">
                    <Play className="mr-2 h-5 w-5" />
                    {t('landing.seeDemo')}
                  </Link>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-8 pt-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>{t('landing.integration24h')}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>{t('landing.lotttCompliance')}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>{t('landing.support247')}</span>
                </div>
              </div>
            </div>

            {/* Hero Illustration */}
            <div className="relative animate-slide-up">
              <div className="relative bg-background rounded-2xl shadow-elegant p-8 border">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">María González</p>
                        <p className="text-sm text-muted-foreground">Empleada</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Aprobado</Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-primary">$240.00</div>
                      <div className="text-sm text-muted-foreground">Disponible para adelanto</div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Salario devengado (15 días):</span>
                        <span>$300.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Disponible (80%):</span>
                        <span className="font-semibold text-primary">$240.00</span>
                      </div>
                    </div>
                    
                    <Button className="w-full" variant="premium">
                      Solicitar Adelanto Ahora
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-secondary text-secondary-foreground px-3 py-2 rounded-lg shadow-card text-sm font-medium animate-pulse-glow">
                ¡Instantáneo!
              </div>
              <div className="absolute -bottom-4 -left-4 bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-card text-sm font-medium">
                PagoMóvil Ready
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-background border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">150+</div>
              <div className="text-sm text-muted-foreground">{t('landing.stats.companies')}</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">$2M+</div>
              <div className="text-sm text-muted-foreground">{t('landing.stats.processed')}</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">12k+</div>
              <div className="text-sm text-muted-foreground">{t('landing.stats.employees')}</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">98%</div>
              <div className="text-sm text-muted-foreground">{t('landing.stats.satisfaction')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              {t('landing.howItWorks.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('landing.howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="h-20 w-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold">1</div>
              </div>
              <h3 className="text-xl font-bold">{t('landing.howItWorks.step1.title')}</h3>
              <p className="text-muted-foreground">
                {t('landing.howItWorks.step1.description')}
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="relative">
                <div className="h-20 w-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold">2</div>
              </div>
              <h3 className="text-xl font-bold">{t('landing.howItWorks.step2.title')}</h3>
              <p className="text-muted-foreground">
                {t('landing.howItWorks.step2.description')}
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="relative">
                <div className="h-20 w-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold">3</div>
              </div>
              <h3 className="text-xl font-bold">{t('landing.howItWorks.step3.title')}</h3>
              <p className="text-muted-foreground">
                {t('landing.howItWorks.step3.description')}
              </p>
            </div>
          </div>

          <div className="bg-background rounded-2xl p-8 shadow-card">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold">Para Empleados: Acceso Instantáneo</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-muted-foreground">Visualiza en tiempo real cuánto has devengado y cuánto puedes solicitar</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-muted-foreground">Recibe el dinero en tu PagoMóvil o cuenta bancaria el mismo día</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-muted-foreground">Se desconta automáticamente de tu próxima nómina</p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="text-2xl font-bold">Para Empresas: Control Total</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="h-6 w-6 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-muted-foreground">Dashboard completo con todos los adelantos y empleados</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="h-6 w-6 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-muted-foreground">Reportes semanales con todos los adelantos para ajustar nómina</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="h-6 w-6 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-muted-foreground">Facturación semanal automatizada, solo paga por lo que uses</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25"
          style={{ backgroundImage: `url(${featuresBgPattern})` }}
        ></div>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-foreground">
              Características Diseñadas para Venezuela
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Cumplimiento LOTTT, integración bancaria completa y la mejor experiencia para empleados y empresas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-none shadow-card hover:shadow-elegant transition-all duration-300 transform hover:-translate-y-1 group">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <CardTitle>PagoMóvil & Bancos</CardTitle>
                <CardDescription>
                  Compatible con todos los bancos venezolanos: Mercantil, Venezuela, Banesco, Provincial y más. 
                  PagoMóvil instantáneo.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-card hover:shadow-elegant transition-all duration-300 transform hover:-translate-y-1 group">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-secondary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Cumplimiento LOTTT</CardTitle>
                <CardDescription>
                  Diseñado específicamente para cumplir con la Ley Orgánica del Trabajo venezolana. 
                  KYC automático y reportes legales.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-card hover:shadow-elegant transition-all duration-300 transform hover:-translate-y-1 group">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Lotes Automáticos</CardTitle>
                <CardDescription>
                  Procesamiento en lotes dos veces al día (11:00 AM y 3:00 PM) para máxima eficiencia 
                  y menores costos operativos.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-card hover:shadow-elegant transition-all duration-300 transform hover:-translate-y-1 group">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-secondary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Analytics Empresarial</CardTitle>
                <CardDescription>
                  Dashboard completo con métricas de uso, análisis de flujo de caja y 
                  reportes de satisfacción de empleados.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-card hover:shadow-elegant transition-all duration-300 transform hover:-translate-y-1 group">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Reportes Automáticos</CardTitle>
                <CardDescription>
                  Exportación automática de reportes CSV/Excel para integración con sistemas 
                  de nómina existentes. Conciliación perfecta.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-card hover:shadow-elegant transition-all duration-300 transform hover:-translate-y-1 group">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-secondary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Banknote className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Límites Inteligentes</CardTitle>
                <CardDescription>
                  Cálculo automático de elegibilidad basado en días trabajados. 
                  Máximo 80% del salario devengado, sin riesgo para la empresa.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-foreground">
              Lo Que Dicen Nuestros Clientes
            </h2>
            <p className="text-xl text-muted-foreground">
              Empresas venezolanas que ya transformaron su nómina con AvancePay
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-none shadow-card">
              <CardHeader>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="h-12 w-12 bg-gradient-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">CA</span>
                  </div>
                  <div>
                    <div className="font-semibold">Carlos Mendoza</div>
                    <div className="text-sm text-muted-foreground">Director de RRHH, TechVenezuela C.A.</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current text-secondary" />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  "AvancePay mejoró significativamente la satisfacción de nuestros empleados. 
                  La implementación fue súper rápida y el soporte técnico es excepcional."
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-card">
              <CardHeader>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="h-12 w-12 bg-gradient-secondary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">MR</span>
                  </div>
                  <div>
                    <div className="font-semibold">María Rodríguez</div>
                    <div className="text-sm text-muted-foreground">Empleada, Servicios Financieros</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current text-secondary" />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  "Es increíble poder acceder a mi salario cuando lo necesito. El proceso es súper fácil 
                  y el dinero llega a mi PagoMóvil en minutos."
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-card">
              <CardHeader>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="h-12 w-12 bg-gradient-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">JS</span>
                  </div>
                  <div>
                    <div className="font-semibold">José Silva</div>
                    <div className="text-sm text-muted-foreground">CEO, Industrias del Zulia</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current text-secondary" />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  "Los reportes semanales facilitan muchísimo nuestra gestión de nómina. 
                  AvancePay se integró perfectamente con nuestros procesos existentes."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Precios Claros y Justos
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Sin letra pequeña. Sin costos ocultos. Solo paga por lo que usas con facturación semanal automatizada.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="relative border-2 border-border shadow-card hover:shadow-elegant transition-all duration-300">
              <CardHeader className="text-center pb-8">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">Para Empresas</CardTitle>
                  <div className="space-y-1">
                    <div className="text-4xl font-bold text-primary">$1</div>
                    <div className="text-muted-foreground">por empleado activo / mes</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Dashboard empresarial completo con analytics</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Reportes CSV/Excel automatizados para nómina</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Gestión completa de empleados y métodos de pago</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Soporte técnico prioritario 24/7</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Facturación semanal con conciliación automática</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Cumplimiento LOTTT y reportes legales</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground mb-4">
                    <strong>Ejemplo práctico:</strong> Empresa con 50 empleados = $50/mes
                  </div>
                  <Button className="w-full" variant="outline" size="lg">
                    Comenzar Prueba Gratis
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="relative border-2 border-primary shadow-elegant hover:scale-105 transition-all duration-300">
              <CardHeader className="text-center pb-8">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-secondary text-secondary-foreground px-4 py-1">
                    Costo cero para empresas
                  </Badge>
                </div>
                <div className="space-y-2 pt-2">
                  <CardTitle className="text-2xl">Para Empleados</CardTitle>
                  <div className="space-y-1">
                    <div className="text-4xl font-bold text-primary">5%</div>
                    <div className="text-muted-foreground">por adelanto (mín. $1, máx. $20)</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Acceso hasta 80% del salario devengado</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Adelantos procesados en lotes (11 AM y 3 PM)</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>PagoMóvil y transferencias a cualquier banco</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>App móvil y web responsive</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Historial completo de adelantos</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Cálculo automático de elegibilidad</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground mb-4">
                    <strong>Ejemplo:</strong> Adelanto de $100 → Recibes $95 (comisión $5)
                  </div>
                  <Button className="w-full" variant="hero" size="lg">
                    Activar Mi Cuenta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12 space-y-4">
            <h3 className="text-2xl font-bold text-foreground">¿Empresas grandes?</h3>
            <p className="text-muted-foreground">
              Planes empresariales personalizados para +500 empleados con descuentos especiales y características avanzadas.
            </p>
            <Button variant="outline" size="lg">
              Contactar Ventas Empresariales
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto max-w-4xl text-center space-y-8 relative">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              ¿Listo para Revolucionar tu Nómina?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Únete a más de 150 empresas venezolanas que ya mejoraron la satisfacción de sus empleados 
              y simplificaron su gestión de adelantos salariales.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="hero" className="text-lg px-12 py-6 group" asChild>
              <Link to="/register">
                Comenzar Prueba Gratuita
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-12 py-6" asChild>
              <Link to="/login">Tengo una Cuenta</Link>
            </Button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 pt-8">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">30 días</div>
              <div className="text-sm text-muted-foreground">Prueba completamente gratis</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">24 horas</div>
              <div className="text-sm text-muted-foreground">Tiempo de implementación</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Soporte técnico incluido</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/20 py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">AvancePay</span>
                <Badge variant="secondary">Venezuela</Badge>
              </div>
              <p className="text-muted-foreground max-w-md">
                La primera plataforma venezolana de adelantos salariales diseñada específicamente 
                para cumplir con LOTTT y optimizar la experiencia de empleados y empresas.
              </p>
              <div className="flex space-x-4">
                <Button variant="outline" size="sm">WhatsApp</Button>
                <Button variant="outline" size="sm">LinkedIn</Button>
                <Button variant="outline" size="sm">Twitter</Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Producto</h4>
              <div className="space-y-3 text-muted-foreground">
                <div className="hover:text-foreground cursor-pointer transition-colors">Características</div>
                <div className="hover:text-foreground cursor-pointer transition-colors">Precios</div>
                <div className="hover:text-foreground cursor-pointer transition-colors">Demo en Vivo</div>
                <div className="hover:text-foreground cursor-pointer transition-colors">Integraciones</div>
                <div className="hover:text-foreground cursor-pointer transition-colors">API</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Empresa</h4>
              <div className="space-y-3 text-muted-foreground">
                <div className="hover:text-foreground cursor-pointer transition-colors">Sobre AvancePay</div>
                <div className="hover:text-foreground cursor-pointer transition-colors">Nuestro Equipo</div>
                <div className="hover:text-foreground cursor-pointer transition-colors">Carreras</div>
                <div className="hover:text-foreground cursor-pointer transition-colors">Contacto</div>
                <div className="hover:text-foreground cursor-pointer transition-colors">Prensa</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Soporte</h4>
              <div className="space-y-3 text-muted-foreground">
                <div className="hover:text-foreground cursor-pointer transition-colors">Centro de Ayuda</div>
                <div className="hover:text-foreground cursor-pointer transition-colors">Documentación</div>
                <div className="hover:text-foreground cursor-pointer transition-colors">Estado del Sistema</div>
                <div className="hover:text-foreground cursor-pointer transition-colors">Términos de Uso</div>
                <div className="hover:text-foreground cursor-pointer transition-colors">Privacidad</div>
              </div>
            </div>
          </div>
          
          <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-muted-foreground text-sm">
              &copy; 2024 AvancePay Venezuela. Todos los derechos reservados. | RIF: J-12345678-9
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Hecho con ❤️ en Venezuela</span>
              <Badge variant="outline">Cumplimiento LOTTT</Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;