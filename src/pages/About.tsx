import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Target, 
  Users, 
  Shield,
  Heart,
  TrendingUp,
  Building,
  Award,
  CheckCircle,
  Globe,
  Zap,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const About = () => {
  const { t } = useLanguage();
  const stats = [
    { icon: Building, label: "Empresas Activas", value: "150+" },
    { icon: Users, label: "Empleados Beneficiados", value: "12,000+" },
    { icon: DollarSign, label: "Procesado Mensualmente", value: "$2M+" },
    { icon: Award, label: "Satisfacción", value: "98%" }
  ];

  const values = [
    {
      icon: Heart,
      title: "Inclusión Financiera",
      description: "Creemos que todos los trabajadores venezolanos merecen acceso a sus salarios devengados cuando los necesiten, sin procesos burocráticos complejos."
    },
    {
      icon: Shield,
      title: "Seguridad y Confianza",
      description: "Protegemos la información de empleados y empresas con los más altos estándares de seguridad, cumpliendo con todas las regulaciones locales."
    },
    {
      icon: TrendingUp,
      title: "Transparencia Total",
      description: "Sin costos ocultos, sin sorpresas. Todos nuestros precios y procesos son completamente transparentes para empleados y empresas."
    },
    {
      icon: Zap,
      title: "Innovación Práctica",
      description: "Desarrollamos tecnología que resuelve problemas reales de los venezolanos, adaptándonos a la realidad bancaria y regulatoria local."
    }
  ];

  const timeline = [
    {
      year: "2024",
      title: "Fundación de AvancePay",
      description: "Identificamos la necesidad de adelantos salariales accesibles en Venezuela y comenzamos el desarrollo de la plataforma."
    },
    {
      year: "2024",
      title: "Lanzamiento MVP",
      description: "Lanzamos nuestra versión inicial con procesamiento manual en lotes, enfocándonos en la experiencia del usuario."
    },
    {
      year: "2024",
      title: "Primeras Empresas",
      description: "Onboardeamos nuestras primeras 50 empresas y 5,000 empleados, procesando más de $500K en adelantos."
    },
    {
      year: "2025",
      title: "Integración Bancaria",
      description: "Planeamos integrar APIs bancarias directas para automatizar completamente el proceso de pagos."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">AvancePay</span>
            </Link>
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

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-20">
          <Badge className="bg-primary/10 text-primary border-primary/20">
            {t('about.badge')}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground">
            {t('about.title')} <span className="bg-gradient-primary bg-clip-text text-transparent">AvancePay</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('about.subtitle')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center border-none shadow-card">
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mission & Vision */}
        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          <Card className="border-none shadow-elegant">
            <CardHeader>
              <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Nuestra Misión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Proporcionar a los trabajadores venezolanos acceso inmediato a sus salarios devengados, 
                eliminando las barreras financieras que limitan su bienestar y productividad.
              </p>
              <p className="text-muted-foreground">
                Creamos una solución tecnológica que beneficia tanto a empleados como a empresas, 
                cumpliendo con todas las regulaciones locales y promoviendo la inclusión financiera en Venezuela.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-elegant">
            <CardHeader>
              <div className="h-12 w-12 bg-gradient-secondary rounded-lg flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Nuestra Visión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Ser la plataforma líder de adelantos salariales en Venezuela, expandiéndonos 
                posteriormente a toda Latinoamérica como el estándar de flexibilidad financiera laboral.
              </p>
              <p className="text-muted-foreground">
                Aspiramos a un futuro donde ningún trabajador tenga que esperar hasta fin de mes 
                para acceder al dinero que ya ha ganado con su trabajo.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Values */}
        <div className="mb-20">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-foreground">Nuestros Valores</h2>
            <p className="text-xl text-muted-foreground">
              Los principios que guían cada decisión que tomamos
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-none shadow-card hover:shadow-elegant transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <value.icon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg">{value.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-20">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-foreground">Nuestra Historia</h2>
            <p className="text-xl text-muted-foreground">
              El camino hacia la democratización de los adelantos salariales
            </p>
          </div>

          <div className="space-y-8">
            {timeline.map((item, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-gradient-secondary rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                </div>
                <Card className="flex-1 border-none shadow-card">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary">{item.year}</Badge>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance */}
        <Card className="bg-gradient-hero border-0 shadow-elegant mb-12">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center space-x-2">
              <Shield className="h-6 w-6" />
              <span>Cumplimiento y Regulaciones</span>
            </CardTitle>
            <CardDescription className="text-lg">
              Operamos bajo el marco legal venezolano con los más altos estándares
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Regulaciones Cumplidas:</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Ley Orgánica del Trabajo (LOTTT)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Regulaciones SUDEBAN</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Normativas AML/KYC</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Protección de Datos Personales</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Certificaciones de Seguridad:</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Encriptación TLS 1.3</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Almacenamiento cifrado AES-256</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Auditorías de seguridad trimestrales</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Monitoreo 24/7</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="text-center bg-background border shadow-elegant">
          <CardContent className="pt-8">
            <h2 className="text-2xl font-bold mb-4">¿Listo para comenzar?</h2>
            <p className="text-muted-foreground mb-6">
              Únete a las empresas que ya confían en AvancePay para brindar flexibilidad financiera a sus empleados
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="premium" asChild>
                <Link to="/register">Comenzar Gratis</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">Contactar Ventas</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;