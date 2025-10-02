import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import React, { Fragment } from "react";
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
import Header from "@/components/Header";
import heroBgVenezuela from "@/assets/hero-bg-venezuela.jpg";
import featuresBgPattern from "@/assets/features-bg-pattern.jpg";

const Landing = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Header showNavigation={true} />

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
                  {t("landing.heroDescription")
                    .split("80%")
                    .map((part, index, arr) =>
                      index < arr.length - 1 ? (
                        <React.Fragment key={index}>
                          {part}
                          <span className="font-semibold text-primary">80%</span>
                        </React.Fragment>
                      ) : (
                        <React.Fragment key={index}>{part}</React.Fragment>
                      )
                    )}
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
                        <p className="font-semibold">{t('landing.sampleEmployeeName')}</p>
                        <p className="text-sm text-muted-foreground">{t('landing.sampleEmployeeRole')}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">{t('landing.sampleApproved')}</Badge>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-primary">$240.00</div>
                      <div className="text-sm text-muted-foreground">{t('landing.availableForAdvance')}</div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>{t('landing.earnedSalary15')}</span>
                        <span>$300.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('landing.availablePercent')}</span>
                        <span className="font-semibold text-primary">$240.00</span>
                      </div>
                    </div>

                    <Button className="w-full" variant="premium">
                      {t('landing.requestAdvanceNow')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-secondary text-secondary-foreground px-3 py-2 rounded-lg shadow-card text-sm font-medium animate-pulse-glow">
                {t('landing.instantBadge')}
              </div>
              <div className="absolute -bottom-4 -left-4 bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-card text-sm font-medium">
                {t('landing.pagoMovilReady')}
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
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">{t('landing.howItWorks.title')}</h2>
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

          <div className="grid md:grid-cols-2 gap-8">
            {/* For Employees Card */}
            <Card className="border-none shadow-elegant">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-foreground mb-6">{t('landing.forEmployeesTitle')}</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-muted-foreground">{t('landing.forEmployeesPoint1')}</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-muted-foreground">{t('landing.forEmployeesPoint2')}</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-muted-foreground">{t('landing.forEmployeesPoint3')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* For Companies Card */}
            <Card className="border-none shadow-elegant">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-foreground mb-6">{t('landing.forCompaniesTitle')}</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-muted-foreground">{t('landing.forCompaniesPoint1')}</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-muted-foreground">{t('landing.forCompaniesPoint2')}</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-muted-foreground">{t('landing.forCompaniesPoint3')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
            <h2 className="text-4xl font-bold text-foreground">{t('landing.features.title')}</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-none shadow-card hover:shadow-elegant transition-all duration-300 transform hover:-translate-y-1 group">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <CardTitle>{t('landing.features.card1.title')}</CardTitle>
                <CardDescription>
                  {t('landing.features.card1.desc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-card hover:shadow-elegant transition-all duration-300 transform hover:-translate-y-1 group">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-secondary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <CardTitle>{t('landing.features.card2.title')}</CardTitle>
                <CardDescription>
                  {t('landing.features.card2.desc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-card hover:shadow-elegant transition-all duration-300 transform hover:-translate-y-1 group">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <CardTitle>{t('landing.features.card3.title')}</CardTitle>
                <CardDescription>
                  {t('landing.features.card3.desc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-card hover:shadow-elegant transition-all duration-300 transform hover:-translate-y-1 group">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-secondary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <CardTitle>{t('landing.features.card4.title')}</CardTitle>
                <CardDescription>
                  {t('landing.features.card4.desc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-card hover:shadow-elegant transition-all duration-300 transform hover:-translate-y-1 group">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <CardTitle>{t('landing.features.card5.title')}</CardTitle>
                <CardDescription>
                  {t('landing.features.card5.desc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-card hover:shadow-elegant transition-all duration-300 transform hover:-translate-y-1 group">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-secondary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Banknote className="h-6 w-6 text-white" />
                </div>
                <CardTitle>{t('landing.features.card6.title')}</CardTitle>
                <CardDescription>
                  {t('landing.features.card6.desc')}
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
            <h2 className="text-4xl font-bold text-foreground">{t('landing.testimonials.title')}</h2>
            <p className="text-xl text-muted-foreground">{t('landing.testimonials.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-none shadow-card">
              <CardHeader>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="h-12 w-12 bg-gradient-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">CA</span>
                  </div>
                  <div>
                    <div className="font-semibold">{t('landing.testimonials.card1.name')}</div>
                    <div className="text-sm text-muted-foreground">{t('landing.testimonials.card1.role')}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current text-secondary" />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">"{t('landing.testimonials.card1.quote')}"</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-card">
              <CardHeader>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="h-12 w-12 bg-gradient-secondary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">MR</span>
                  </div>
                  <div>
                    <div className="font-semibold">{t('landing.testimonials.card2.name')}</div>
                    <div className="text-sm text-muted-foreground">{t('landing.testimonials.card2.role')}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current text-secondary" />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">"{t('landing.testimonials.card2.quote')}"</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-card">
              <CardHeader>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="h-12 w-12 bg-gradient-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">JS</span>
                  </div>
                  <div>
                    <div className="font-semibold">{t('landing.testimonials.card3.name')}</div>
                    <div className="text-sm text-muted-foreground">{t('landing.testimonials.card3.role')}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current text-secondary" />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">"{t('landing.testimonials.card3.quote')}"</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">{t('landing.pricing.title')}</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">{t('landing.pricing.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="relative border-2 border-border shadow-card hover:shadow-elegant transition-all duration-300">
              <CardHeader className="text-center pb-8">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">{t('landing.pricing.planCompany.title')}</CardTitle>
                  <div className="space-y-1">
                    <div className="text-4xl font-bold text-primary">$1</div>
                    <div className="text-muted-foreground">{t('landing.pricing.planCompany.priceNote')}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('landing.pricing.company.b1')}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('landing.pricing.company.b2')}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('landing.pricing.company.b3')}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('landing.pricing.company.b4')}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('landing.pricing.company.b5')}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('landing.pricing.company.b6')}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground mb-4">
                    <strong>{t('landing.pricing.companyExampleLabel') || 'Example:'}</strong> {t('landing.pricing.company.example')}
                  </div>
                  <Button className="w-full" variant="outline" size="lg">
                    {t('landing.pricing.company.cta')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="relative border-2 border-primary shadow-elegant hover:scale-105 transition-all duration-300">
              <CardHeader className="text-center pb-8">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-secondary text-secondary-foreground px-4 py-1">{t('landing.pricing.badge')}</Badge>
                </div>
                <div className="space-y-2 pt-2">
                  <CardTitle className="text-2xl">{t('landing.pricing.planEmployee.title')}</CardTitle>
                  <div className="space-y-1">
                    <div className="text-4xl font-bold text-primary">5%</div>
                    <div className="text-muted-foreground">{t('landing.pricing.employee.priceNote')}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('landing.pricing.employee.b1')}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('landing.pricing.employee.b2')}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('landing.pricing.employee.b3')}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('landing.pricing.employee.b4')}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('landing.pricing.employee.b5')}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('landing.pricing.employee.b6')}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground mb-4">
                    <strong>{t('landing.pricing.employeeExampleLabel') || 'Example:'}</strong> {t('landing.pricing.employee.example')}
                  </div>
                  <Button className="w-full" variant="hero" size="lg">
                    {t('landing.pricing.employee.cta')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12 space-y-4">
            <h3 className="text-2xl font-bold text-foreground">{t('landing.pricing.enterprise.title')}</h3>
            <p className="text-muted-foreground">
              {t('landing.pricing.enterprise.description')}
            </p>
            <Button variant="outline" size="lg">
              {t('landing.pricing.enterprise.cta')}
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto max-w-4xl text-center space-y-8 relative">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">{t('landing.cta.title')}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t('landing.cta.subtitle')}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="hero" className="text-lg px-12 py-6 group" asChild>
              <Link to="/register">
                {t('landing.cta.startTrial')}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-12 py-6" asChild>
              <Link to="/login">{t('landing.cta.haveAccount')}</Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 pt-8">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">{t('landing.cta.metric30')}</div>
              <div className="text-sm text-muted-foreground">{t('landing.cta.metric30Label')}</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">{t('landing.cta.metric24h')}</div>
              <div className="text-sm text-muted-foreground">{t('landing.cta.metric24hLabel')}</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">{t('landing.cta.metric247')}</div>
              <div className="text-sm text-muted-foreground">{t('landing.cta.metric247Label')}</div>
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
                {t('footer.description')}
              </p>
              <div className="flex space-x-4">
                <Button variant="outline" size="sm">WhatsApp</Button>
                <Button variant="outline" size="sm">LinkedIn</Button>
                <Button variant="outline" size="sm">Twitter</Button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">{t('footer.product')}</h4>
              <div className="space-y-3 text-muted-foreground">
                <div className="hover:text-foreground cursor-pointer transition-colors">{t('footer.product.features')}</div>
                <div className="hover:text-foreground cursor-pointer transition-colors">{t('footer.product.pricing')}</div>
                <div className="hover:text-foreground cursor-pointer transition-colors">{t('footer.product.liveDemo')}</div>
                <div className="hover:text-foreground cursor-pointer transition-colors">{t('footer.product.integrations')}</div>
                <div className="hover:text-foreground cursor-pointer transition-colors">API</div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">{t('footer.company')}</h4>
              <div className="space-y-3 text-muted-foreground">
                <div className="hover:text-foreground cursor-pointer transition-colors">{t('footer.company.about')}</div>
                <div className="hover:text-foreground cursor-pointer transition-colors">{t('footer.company.team')}</div>
                <div className="hover:text-foreground cursor-pointer transition-colors">{t('footer.company.careers')}</div>
                <div className="hover:text-foreground cursor-pointer transition-colors">{t('footer.company.contact')}</div>
                <div className="hover:text-foreground cursor-pointer transition-colors">{t('footer.company.press')}</div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">{t('footer.support')}</h4>
              <div className="space-y-3 text-muted-foreground">
                <div className="hover:text-foreground cursor-pointer transition-colors">{t('footer.support.helpCenter')}</div>
                <div className="hover:text-foreground cursor-pointer transition-colors">{t('footer.support.docs')}</div>
                <div className="hover:text-foreground cursor-pointer transition-colors">{t('footer.support.status')}</div>
                <div className="hover:text-foreground cursor-pointer transition-colors">{t('footer.support.terms')}</div>
                <div className="hover:text-foreground cursor-pointer transition-colors">{t('footer.support.privacy')}</div>
              </div>
            </div>
          </div>

          <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-muted-foreground text-sm">
              &copy; 2024 AvancePay Venezuela. {t('footer.copyright')} | RIF: J123456789
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>{t('footer.madeInVe')}</span>
              <Badge variant="outline">{t('footer.lotttBadge')}</Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;