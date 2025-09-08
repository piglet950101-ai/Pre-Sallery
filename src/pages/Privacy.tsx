import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DollarSign, 
  Shield, 
  Lock,
  Eye,
  Database,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Settings
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Privacy = () => {
  const { t } = useLanguage();
  const dataTypes = [
    {
      category: "Información Personal",
      icon: UserCheck,
      items: [
        "Nombre completo y cédula de identidad",
        "Dirección de email y número telefónico", 
        "Información laboral (empresa, cargo, salario)",
        "Datos bancarios y PagoMóvil"
      ]
    },
    {
      category: "Información Empresarial",
      icon: Database,
      items: [
        "RIF y documentos constitutivos",
        "Información del representante legal",
        "Datos de empleados registrados",
        "Histórico de transacciones y adelantos"
      ]
    },
    {
      category: "Información Técnica",
      icon: Settings,
      items: [
        "Dirección IP y datos del dispositivo",
        "Logs de acceso y actividad en la plataforma",
        "Cookies y tecnologías de rastreo",
        "Información de geolocalización"
      ]
    }
  ];

  const securityMeasures = [
    {
      title: "Encriptación",
      description: "AES-256 para datos en reposo, TLS 1.3 para datos en tránsito",
      icon: Lock
    },
    {
      title: "Control de Acceso",
      description: "Autenticación multifactor y controles de acceso basados en roles",
      icon: Shield
    },
    {
      title: "Monitoreo",
      description: "Supervisión 24/7 de sistemas y detección de anomalías",
      icon: Eye
    },
    {
      title: "Auditorías",
      description: "Revisiones trimestrales de seguridad por terceros certificados",
      icon: CheckCircle
    }
  ];

  const rights = [
    "Acceder a tus datos personales que procesamos",
    "Rectificar información incorrecta o incompleta", 
    "Solicitar eliminación de datos (derecho al olvido)",
    "Limitar el procesamiento de tus datos",
    "Portabilidad de datos en formato estructurado",
    "Oponerte al procesamiento para fines específicos",
    "Retirar consentimiento en cualquier momento",
    "Presentar quejas ante autoridades de protección de datos"
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
        {/* Header */}
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            {t('privacy.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('privacy.subtitle')}
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              Última actualización: Septiembre 2024
            </Badge>
            <Badge variant="outline">Versión 1.0</Badge>
          </div>
        </div>

        {/* Privacy Commitment */}
        <Alert className="mb-12">
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-base">
            <strong>Nuestro Compromiso:</strong> En AvancePay, la privacidad de nuestros usuarios es fundamental. 
            Esta política explica de manera transparente cómo manejamos tu información personal, 
            cumpliendo con todas las regulaciones venezolanas e internacionales aplicables.
          </AlertDescription>
        </Alert>

        {/* What We Collect */}
        <Card className="mb-12 shadow-elegant border-0">
          <CardHeader>
            <CardTitle className="text-2xl">Información que Recolectamos</CardTitle>
            <CardDescription>
              Recolectamos únicamente la información necesaria para proporcionar nuestros servicios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {dataTypes.map((type, index) => (
                <Card key={index} className="border shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <type.icon className="h-5 w-5 text-primary" />
                      <span>{type.category}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {type.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start space-x-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-primary mt-1 flex-shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* How We Use Data */}
        <Card className="mb-12 shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-2xl">Cómo Usamos tu Información</CardTitle>
            <CardDescription>
              Tu información se utiliza exclusivamente para los siguientes propósitos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Operaciones Principales:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Procesamiento de adelantos salariales</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Verificación de identidad (KYC)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Comunicación con usuarios</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Facturación y contabilidad</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Cumplimiento Legal:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Cumplimiento regulatorio (SUDEBAN, LOTTT)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Prevención de lavado de dinero (AML)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Reportes gubernamentales requeridos</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Auditorías y supervisión</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Measures */}
        <Card className="mb-12 shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-2xl">Medidas de Seguridad</CardTitle>
            <CardDescription>
              Implementamos múltiples capas de seguridad para proteger tu información
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {securityMeasures.map((measure, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-lg bg-gradient-hero">
                  <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <measure.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{measure.title}</h3>
                    <p className="text-sm text-muted-foreground">{measure.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Sharing */}
        <Card className="mb-12 shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-2xl">Compartir Información</CardTitle>
            <CardDescription>
              Cuándo y con quién compartimos tu información personal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Principio General:</strong> No vendemos, alquilamos ni compartimos tu información personal 
                con terceros para fines comerciales. Solo compartimos información en las siguientes circunstancias específicas:
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Proveedores de Servicios Autorizados</h4>
                <p className="text-sm text-muted-foreground">
                  Bancos y PSPs para procesamiento de pagos, servicios de SMS/email, 
                  proveedores de hosting con contratos de confidencialidad.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Requerimientos Legales</h4>
                <p className="text-sm text-muted-foreground">
                  Autoridades venezolanas competentes cuando sea requerido por ley, 
                  orden judicial o investigación gubernamental autorizada.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Consentimiento Explícito</h4>
                <p className="text-sm text-muted-foreground">
                  Solo cuando hayas dado consentimiento específico e informado 
                  para compartir información con terceros específicos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card className="mb-12 shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-2xl">Tus Derechos</CardTitle>
            <CardDescription>
              Como usuario de AvancePay, tienes los siguientes derechos sobre tu información personal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {rights.map((right, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{right}</span>
                </div>
              ))}
            </div>
            
            <Separator className="my-6" />
            
            <div className="bg-gradient-hero p-4 rounded-lg">
              <h4 className="font-semibold mb-2">¿Cómo ejercer tus derechos?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Para ejercer cualquiera de estos derechos, contáctanos a través de:
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  privacidad@avancepay.ve
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/contact">Formulario de Contacto</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card className="mb-12 shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-2xl">Retención de Datos</CardTitle>
            <CardDescription>
              Cuánto tiempo conservamos tu información personal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Datos Activos</h4>
                <p className="text-sm text-muted-foreground">
                  Mientras mantengas tu cuenta activa y por el período requerido 
                  para cumplir con obligaciones legales.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Datos Transaccionales</h4>
                <p className="text-sm text-muted-foreground">
                  7 años después de la última transacción, según requerimientos 
                  contables y regulatorios venezolanos.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Datos KYC</h4>
                <p className="text-sm text-muted-foreground">
                  5 años después del cierre de cuenta, según regulaciones 
                  AML y SUDEBAN.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact for Privacy */}
        <Card className="bg-background border shadow-elegant text-center">
          <CardContent className="pt-8">
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-4">¿Preguntas sobre Privacidad?</h3>
            <p className="text-muted-foreground mb-6">
              Nuestro Oficial de Protección de Datos está disponible para resolver 
              cualquier duda sobre el manejo de tu información personal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="premium" asChild>
                <Link to="/contact">Contactar DPO</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/terms">Ver Términos de Servicio</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="mt-16 text-center">
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground transition-colors">Sobre AvancePay</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-foreground transition-colors">Términos</Link>
            <span>•</span>
            <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-foreground transition-colors">Contacto</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;