import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, 
  FileText, 
  Shield,
  AlertTriangle,
  CheckCircle,
  Scale,
  Clock,
  Building,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Terms = () => {
  const { t } = useLanguage();
  const sections = [
    {
      title: "1. Definiciones y Conceptos",
      icon: FileText,
      content: [
        {
          subtitle: "Plataforma AvancePay",
          text: "Sistema tecnológico desarrollado para facilitar adelantos salariales entre empresas y empleados en Venezuela."
        },
        {
          subtitle: "Adelanto Salarial",
          text: "Cantidad de dinero adelantada al empleado sobre su salario devengado, limitada al 80% del monto ganado según días trabajados."
        },
        {
          subtitle: "Usuario Empresa",
          text: "Persona jurídica registrada que utiliza la plataforma para ofrecer adelantos salariales a sus empleados."
        },
        {
          subtitle: "Usuario Empleado",
          text: "Persona natural vinculada laboralmente con una empresa registrada, autorizada para solicitar adelantos."
        }
      ]
    },
    {
      title: "2. Registro y Elegibilidad",
      icon: Users,
      content: [
        {
          subtitle: "Empresas",
          text: "Deben ser personas jurídicas constituidas en Venezuela con RIF válido. Requieren registro mercantil vigente y representante legal identificado."
        },
        {
          subtitle: "Empleados",
          text: "Registro únicamente por invitación empresarial. Requieren cédula de identidad venezolana válida y relación laboral comprobada."
        },
        {
          subtitle: "Documentación KYC",
          text: "Ambos tipos de usuarios deben completar procesos de verificación de identidad según normativas AML venezolanas."
        }
      ]
    },
    {
      title: "3. Funcionamiento del Servicio",
      icon: DollarSign,
      content: [
        {
          subtitle: "Límites de Adelanto",
          text: "Máximo 80% del salario devengado calculado proporcionalmente según días trabajados. La empresa puede establecer límites adicionales."
        },
        {
          subtitle: "Procesamiento",
          text: "Adelantos procesados en lotes diarios a las 11:00 AM y 3:00 PM, de lunes a viernes. Transferencias via PagoMóvil o transferencia bancaria."
        },
        {
          subtitle: "Aprobación",
          text: "Aprobación automática para solicitudes dentro de límites establecidos. La empresa puede requerir aprobación manual para casos específicos."
        }
      ]
    },
    {
      title: "4. Estructura de Costos",
      icon: Building,
      content: [
        {
          subtitle: "Costo Empresarial",
          text: "USD $1 por empleado activo mensualmente. Facturación semanal del monto total de adelantos otorgados (sin intereses)."
        },
        {
          subtitle: "Costo del Empleado",
          text: "5% de comisión por adelanto solicitado, con mínimo de USD $1. Descontado automáticamente del monto recibido."
        },
        {
          subtitle: "Sin Costos Ocultos",
          text: "No existen costos de activación, mantenimiento o penalizaciones. Todos los costos son transparentes y comunicados previamente."
        }
      ]
    },
    {
      title: "5. Obligaciones y Responsabilidades",
      icon: Scale,
      content: [
        {
          subtitle: "De la Empresa",
          text: "Proporcionar información veraz de empleados, mantener datos actualizados, cumplir con pagos de facturas y respetar deducciones de nómina."
        },
        {
          subtitle: "Del Empleado",
          text: "Usar el servicio responsablemente, proporcionar información veraz, autorizar descuentos de nómina por adelantos recibidos."
        },
        {
          subtitle: "De AvancePay",
          text: "Procesar adelantos según términos acordados, mantener seguridad de la información, proporcionar soporte técnico."
        }
      ]
    },
    {
      title: "6. Privacidad y Protección de Datos",
      icon: Shield,
      content: [
        {
          subtitle: "Recolección de Datos",
          text: "Recolectamos únicamente datos necesarios para operación del servicio: información laboral, bancaria y de identificación."
        },
        {
          subtitle: "Uso de Datos",
          text: "Datos utilizados exclusivamente para procesamiento de adelantos, cumplimiento regulatorio y mejora del servicio."
        },
        {
          subtitle: "Seguridad",
          text: "Implementamos encriptación AES-256, TLS 1.3 y controles de acceso estrictos. Auditorías de seguridad trimestrales."
        }
      ]
    },
    {
      title: "7. Limitación de Responsabilidad",
      icon: AlertTriangle,
      content: [
        {
          subtitle: "Fuerza Mayor",
          text: "No nos responsabilizamos por interrupciones causadas por fallas bancarias, regulatorias o gubernamentales fuera de nuestro control."
        },
        {
          subtitle: "Datos Incorrectos",
          text: "No somos responsables por errores de transferencia causados por información bancaria incorrecta proporcionada por usuarios."
        },
        {
          subtitle: "Límites Monetarios",
          text: "Nuestra responsabilidad máxima se limita al monto total pagado por el usuario en los últimos 12 meses."
        }
      ]
    },
    {
      title: "8. Cumplimiento Regulatorio",
      icon: CheckCircle,
      content: [
        {
          subtitle: "LOTTT",
          text: "Cumplimiento estricto con la Ley Orgánica del Trabajo venezolana. Adelantos registrados como anticipo salarial deducible."
        },
        {
          subtitle: "SUDEBAN",
          text: "Operaciones realizadas dentro del marco regulatorio de la Superintendencia de Bancos de Venezuela."
        },
        {
          subtitle: "AML/KYC",
          text: "Implementación de controles contra lavado de dinero y verificación de identidad según normativas locales."
        }
      ]
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
        {/* Header */}
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            {t('terms.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('terms.subtitle')}
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              Última actualización: Septiembre 2024
            </Badge>
            <Badge variant="outline">Versión 1.0</Badge>
          </div>
        </div>

        {/* Legal Notice */}
        <Card className="mb-12 bg-gradient-hero border-0 shadow-elegant">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <AlertTriangle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Aviso Legal Importante</h3>
                <p className="text-muted-foreground">
                  Al utilizar AvancePay, usted acepta estar sujeto a estos términos de servicio. 
                  Si no está de acuerdo con alguna parte de estos términos, no debe usar nuestro servicio. 
                  Estos términos constituyen un acuerdo legal vinculante entre usted y AvancePay Venezuela, C.A.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <Card key={index} className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gradient-secondary rounded-lg flex items-center justify-center">
                    <section.icon className="h-5 w-5 text-white" />
                  </div>
                  <span>{section.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {section.content.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    <h4 className="font-semibold text-lg mb-2">{item.subtitle}</h4>
                    <p className="text-muted-foreground">{item.text}</p>
                    {itemIndex < section.content.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modification Notice */}
        <Card className="mt-16 border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Modificaciones a los Términos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              AvancePay se reserva el derecho de modificar estos términos en cualquier momento. 
              Las modificaciones serán efectivas inmediatamente después de su publicación en la plataforma. 
              El uso continuado del servicio después de las modificaciones constituye la aceptación de los nuevos términos.
            </p>
            <p className="text-muted-foreground">
              Los usuarios serán notificados de cambios significativos vía email y notificación en la plataforma 
              con al menos 30 días de anticipación.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mt-12 bg-background border shadow-card">
          <CardContent className="pt-8 text-center">
            <h3 className="text-xl font-semibold mb-4">¿Preguntas sobre los Términos?</h3>
            <p className="text-muted-foreground mb-6">
              Si tienes dudas sobre estos términos de servicio, contacta a nuestro equipo legal
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" asChild>
                <Link to="/contact">Contactar</Link>
              </Button>
              <Button variant="link" asChild>
                <Link to="/privacy">Ver Política de Privacidad</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="mt-16 text-center">
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground transition-colors">Sobre AvancePay</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacidad</Link>
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

export default Terms;