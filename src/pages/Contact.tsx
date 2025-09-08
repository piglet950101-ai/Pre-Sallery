import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  MapPin, 
  Phone, 
  Mail,
  MessageCircle,
  Building,
  Users,
  HelpCircle,
  Send,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Contact = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    subject: "",
    message: "",
    type: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "¡Mensaje enviado!",
        description: "Gracias por contactarnos. Te responderemos en las próximas 4 horas.",
      });
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        company: "",
        phone: "",
        subject: "",
        message: "",
        type: ""
      });
    }, 2000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const contactMethods = [
    {
      icon: MessageCircle,
      title: "WhatsApp",
      description: "Respuesta inmediata",
      contact: "+58 412 123-4567",
      subtitle: "Lun - Dom, 24 horas"
    },
    {
      icon: Mail,
      title: "Email",
      description: "Respuesta en 4 horas",
      contact: "contacto@avancepay.ve",
      subtitle: "Para consultas generales"
    },
    {
      icon: Phone,
      title: "Teléfono",
      description: "Llamada directa",
      contact: "0212-123-4567",
      subtitle: "Lun - Vie, 9 AM - 6 PM"
    }
  ];

  const offices = [
    {
      city: "Caracas",
      address: "Av. Francisco de Miranda, Centro Lido, Torre A, Piso 15",
      phone: "0212-123-4567"
    },
    {
      city: "Maracaibo",
      address: "Av. Bella Vista, Centro Comercial Doral Center, Piso 8",
      phone: "0261-123-4567"
    },
    {
      city: "Valencia",
      address: "Av. Bolívar Norte, Torre Financiera, Piso 12",
      phone: "0241-123-4567"
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
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            {t('contact.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-elegant border-0">
              <CardHeader>
                <CardTitle className="text-2xl">Envíanos un mensaje</CardTitle>
                <CardDescription>
                  Completa el formulario y nos pondremos en contacto contigo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre completo *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Tu nombre"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="tu@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Empresa</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => handleInputChange("company", e.target.value)}
                        placeholder="Nombre de tu empresa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="+58 412 123-4567"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de consulta *</Label>
                    <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de consulta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">
                          <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4" />
                            <span>Ventas - Interés en contratar</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="support">
                          <div className="flex items-center space-x-2">
                            <HelpCircle className="h-4 w-4" />
                            <span>Soporte técnico</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="partnership">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>Alianzas estratégicas</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="media">
                          <div className="flex items-center space-x-2">
                            <MessageCircle className="h-4 w-4" />
                            <span>Prensa y medios</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="other">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>Otros</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Asunto *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => handleInputChange("subject", e.target.value)}
                      placeholder="¿En qué podemos ayudarte?"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Mensaje *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      placeholder="Cuéntanos más detalles sobre tu consulta..."
                      className="min-h-[120px]"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant="premium"
                    disabled={isSubmitting || !formData.name || !formData.email || !formData.type || !formData.subject || !formData.message}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar Mensaje
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            {/* Contact Methods */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle>Canales de Contacto</CardTitle>
                <CardDescription>
                  Múltiples formas de comunicarte con nosotros
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactMethods.map((method, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                      <method.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{method.title}</div>
                      <div className="text-sm text-muted-foreground">{method.description}</div>
                      <div className="text-sm font-medium text-primary">{method.contact}</div>
                      <div className="text-xs text-muted-foreground">{method.subtitle}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Office Locations */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Nuestras Oficinas</span>
                </CardTitle>
                <CardDescription>
                  Ubicaciones principales en Venezuela
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {offices.map((office, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="font-semibold text-primary">{office.city}</div>
                    <div className="text-sm text-muted-foreground mt-1">{office.address}</div>
                    <div className="text-sm font-medium mt-2">{office.phone}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Response Time */}
            <Card className="bg-gradient-hero border-0 shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div className="font-semibold">Tiempos de Respuesta</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>WhatsApp:</span>
                    <span className="font-medium">&lt; 15 minutos</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <span className="font-medium">&lt; 4 horas</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Teléfono:</span>
                    <span className="font-medium">Inmediato</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Link */}
        <Card className="mt-12 text-center bg-background border shadow-card">
          <CardContent className="pt-8">
            <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">¿Buscas respuestas rápidas?</h3>
            <p className="text-muted-foreground mb-4">
              Visita nuestra sección de preguntas frecuentes donde encontrarás respuestas 
              a las dudas más comunes sobre AvancePay.
            </p>
            <Button variant="outline" asChild>
              <Link to="/faq">Ver Preguntas Frecuentes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Contact;