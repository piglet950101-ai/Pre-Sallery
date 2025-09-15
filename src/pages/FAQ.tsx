import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  HelpCircle, 
  MessageCircle, 
  Phone,
  Mail,
  Clock,
  Shield,
  CreditCard,
  Users,
  Building,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";

const FAQ = () => {
  const { t } = useLanguage();
  const faqCategories = [
    {
      title: "Para Empleados",
      icon: Users,
      questions: [
        {
          q: "¿Cuánto puedo solicitar de adelanto?",
          a: "Puedes solicitar hasta el 80% de tu salario devengado según los días trabajados. Por ejemplo, si trabajaste 15 días de un mes de 30 días y tu salario es $600, has devengado $300, por lo que puedes solicitar hasta $240 (80% de $300)."
        },
        {
          q: "¿Cuánto cuesta usar AvancePay?",
          a: "Como empleado, pagas una comisión del 5% por cada adelanto, con un mínimo de $1 USD. Esta comisión se descuenta automáticamente del monto que recibes. No hay costos mensuales ni de activación."
        },
        {
          q: "¿Cuándo recibo mi dinero?",
          a: "Los adelantos se procesan en lotes dos veces al día: a las 11:00 AM y a las 3:00 PM, de lunes a viernes. Si solicitas antes de las 11:00 AM, recibirás el dinero ese mismo día a las 11:00 AM o 3:00 PM según disponibilidad."
        },
        {
          q: "¿Puedo usar PagoMóvil?",
          a: "¡Sí! AvancePay es compatible con PagoMóvil de todos los bancos venezolanos. También puedes recibir transferencias bancarias directas. Tu empresa configura tus métodos de pago preferidos."
        },
        {
          q: "¿Cómo se descuenta de mi nómina?",
          a: "El adelanto se descuenta automáticamente de tu próxima nómina. Tu empresa recibe un reporte detallado para ajustar el pago. Es completamente transparente y cumple con la LOTTT."
        },
        {
          q: "¿Puedo cambiar mis datos bancarios?",
          a: "Por seguridad, solo tu empresa puede modificar datos personales, bancarios o de PagoMóvil. Contacta a tu departamento de RRHH para cualquier cambio."
        }
      ]
    },
    {
      title: "Para Empresas",
      icon: Building,
      questions: [
        {
          q: "¿Cuánto cuesta AvancePay para mi empresa?",
          a: "Las empresas pagan $1 USD por empleado activo al mes. Además, facturamos semanalmente los adelantos otorgados (sin intereses). No hay costos de setup ni comisiones adicionales."
        },
        {
          q: "¿Cómo funciona la aprobación de adelantos?",
          a: "Los adelantos se aprueban automáticamente si están dentro del 80% del salario devengado. Puedes configurar límites adicionales o requerir aprobación manual para montos específicos."
        },
        {
          q: "¿Qué información necesito para registrar empleados?",
          a: "Necesitas: nombre completo, cédula, salario mensual, datos bancarios o PagoMóvil, email y teléfono. Los empleados reciben un código de activación por SMS/email."
        },
        {
          q: "¿Cómo funciona la facturación?",
          a: "Recibes dos tipos de facturas: 1) Semanalmente por los adelantos otorgados (monto que debemos recuperar), 2) Mensualmente por las comisiones de empleados activos ($1 por empleado)."
        },
        {
          q: "¿Es compatible con mi sistema de nómina?",
          a: "Sí, proveemos reportes detallados en Excel/CSV con todos los adelantos para que ajustes fácilmente tu nómina. En fases futuras ofreceremos integración API directa."
        },
        {
          q: "¿Cumple con la LOTTT?",
          a: "Absolutamente. AvancePay está diseñado específicamente para cumplir con la Ley Orgánica del Trabajo venezolana. Todos los adelantos se registran correctamente y son deducibles de nómina."
        }
      ]
    },
    {
      title: "Seguridad y Legal",
      icon: Shield,
      questions: [
        {
          q: "¿Es seguro usar AvancePay?",
          a: "Sí, utilizamos encriptación de nivel bancario para proteger toda la información. Los datos sensibles como cédulas y cuentas bancarias están cifrados. Cumplimos con estándares internacionales de seguridad."
        },
        {
          q: "¿Qué pasa si hay un error en la transferencia?",
          a: "Tenemos un sistema de reconciliación diaria. Si detectamos algún error, lo corregimos inmediatamente. También tienes soporte 24/7 para reportar cualquier problema."
        },
        {
          q: "¿Qué documentos KYC necesito?",
          a: "Empleados: cédula vigente. Empresas: RIF, documento constitutivo, registro mercantil, y identificación del representante legal. Todo se sube de forma segura a la plataforma."
        },
        {
          q: "¿Quién regula AvancePay?",
          a: "Operamos bajo el marco legal venezolano cumpliendo con SUDEBAN, LOTTT y regulaciones AML. Estamos trabajando en partnerships con bancos locales para mayor regulación."
        }
      ]
    },
    {
      title: "Técnico y Soporte",
      icon: HelpCircle,
      questions: [
        {
          q: "¿Qué bancos son compatibles?",
          a: "Todos los bancos venezolanos: Mercantil, Venezuela, Banesco, Provincial, BOD, Exterior, Caroní, Plaza, Sofitasa, Activo, Del Sur, y más. También PagoMóvil universal."
        },
        {
          q: "¿Funciona los fines de semana?",
          a: "Puedes solicitar adelantos 24/7, pero el procesamiento ocurre solo de lunes a viernes a las 11:00 AM y 3:00 PM debido a las limitaciones bancarias venezolanas."
        },
        {
          q: "¿Qué pasa si mi solicitud falla?",
          a: "Si una transferencia falla (ej: datos incorrectos), aparece en nuestro sistema de excepciones. Lo reintentamos en el siguiente lote o te contactamos para corregir los datos."
        },
        {
          q: "¿Cómo contacto soporte?",
          a: "Tienes soporte 24/7 por WhatsApp, email y teléfono. También chat en vivo en la plataforma. Los tiempos de respuesta son: crítico <1 hora, normal <4 horas."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Header showNavigation={false} />

      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
            <HelpCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            {t('faq.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('faq.subtitle')}
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqCategories.map((category, categoryIndex) => (
            <Card key={categoryIndex} className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gradient-secondary rounded-lg flex items-center justify-center">
                    <category.icon className="h-5 w-5 text-white" />
                  </div>
                  <span>{category.title}</span>
                  <Badge variant="outline">{category.questions.length} {t('faq.questionsCount')}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${categoryIndex}-${index}`}>
                      <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Support */}
        <Card className="mt-16 bg-gradient-hero border-0 shadow-elegant">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">¿No encontraste tu respuesta?</CardTitle>
            <CardDescription className="text-lg">
              Nuestro equipo de soporte está disponible 24/7 para ayudarte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <MessageCircle className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">WhatsApp</h3>
                  <p className="text-sm text-muted-foreground mb-4">Respuesta inmediata</p>
                  <Button variant="outline" size="sm">
                    +58 412 123-4567
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <Mail className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Email</h3>
                  <p className="text-sm text-muted-foreground mb-4">&lt; 4 horas</p>
                  <Button variant="outline" size="sm">
                    soporte@avancepay.ve
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <Phone className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Teléfono</h3>
                  <p className="text-sm text-muted-foreground mb-4">9 AM - 6 PM</p>
                  <Button variant="outline" size="sm">
                    0212-123-4567
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="mt-16 text-center">
          <h3 className="text-lg font-semibold mb-6">Enlaces útiles</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="link" asChild>
              <Link to="/about">Sobre AvancePay</Link>
            </Button>
            <Button variant="link" asChild>
              <Link to="/terms">Términos de Servicio</Link>
            </Button>
            <Button variant="link" asChild>
              <Link to="/privacy">Política de Privacidad</Link>
            </Button>
            <Button variant="link" asChild>
              <Link to="/contact">Contacto</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;