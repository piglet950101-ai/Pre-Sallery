import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

// Translation object type
interface Translations {
  [key: string]: {
    en: string;
    es: string;
  };
}

// All translations in one place
const translations: Translations = {
  // Navigation
  'nav.features': { en: 'Features', es: 'Características' },
  'nav.howItWorks': { en: 'How It Works', es: 'Cómo Funciona' },
  'nav.pricing': { en: 'Pricing', es: 'Precios' },
  'nav.testimonials': { en: 'Testimonials', es: 'Testimonios' },
  'nav.login': { en: 'Login', es: 'Iniciar Sesión' },
  'nav.getStarted': { en: 'Get Started Free', es: 'Comenzar Gratis' },
  'nav.about': { en: 'About', es: 'Acerca de' },
  'nav.contact': { en: 'Contact', es: 'Contacto' },
  'nav.faq': { en: 'FAQ', es: 'Preguntas Frecuentes' },
  'nav.terms': { en: 'Terms', es: 'Términos' },
  'nav.privacy': { en: 'Privacy', es: 'Privacidad' },
  'nav.dashboard': { en: 'Dashboard', es: 'Panel' },
  'nav.logout': { en: 'Logout', es: 'Cerrar Sesión' },
  'nav.welcome': { en: 'Welcome', es: 'Bienvenido' },
  'nav.employeePanel': { en: 'Employee Panel', es: 'Panel de Empleado' },
  'nav.companyPanel': { en: 'Company Panel', es: 'Panel de Empresa' },
  'nav.operatorPanel': { en: 'Operator Panel', es: 'Panel de Operador' },

  // Landing Page - Hero Section
  'landing.badge': { en: '🇻🇪 Designed specifically for Venezuela', es: '🇻🇪 Diseñado específicamente para Venezuela' },
  'landing.heroTitle1': { en: 'Payroll', es: 'Adelantos de' },
  'landing.heroTitle2': { en: 'Advances', es: 'Nómina' },
  'landing.heroTitle3': { en: 'Instantly', es: 'al Instante' },
  'landing.heroDescription': { 
    en: 'Allow your employees to access up to 80% of their earned salary in seconds. Compatible with PagoMóvil and all Venezuelan banks.',
    es: 'Permite a tus empleados acceder hasta el 80% de sus salarios devengados en segundos. Compatible con PagoMóvil y todos los bancos venezolanos.'
  },
  'landing.startFree30': { en: 'Start Free 30 Days', es: 'Comenzar Gratis 30 Días' },
  'landing.seeDemo': { en: 'See Demo', es: 'Ver Demo' },
  'landing.integration24h': { en: '24-hour integration', es: 'Integración en 24 horas' },
  'landing.lotttCompliance': { en: 'LOTTT Compliance', es: 'Cumplimiento LOTTT' },
  'landing.support247': { en: '24/7 Support', es: 'Soporte 24/7' },

  // Landing Page - Stats
  'landing.stats.companies': { en: 'Active Companies', es: 'Empresas Activas' },
  'landing.stats.processed': { en: 'Processed Monthly', es: 'Procesados Mensualmente' },
  'landing.stats.employees': { en: 'Registered Employees', es: 'Empleados Registrados' },
  'landing.stats.satisfaction': { en: 'Satisfaction', es: 'Satisfacción' },

  // Landing Page - How it Works
  'landing.howItWorks.title': { en: 'How AvancePay Works', es: 'Cómo Funciona AvancePay' },
  'landing.howItWorks.subtitle': { 
    en: 'A simple and automated process that benefits both companies and employees',
    es: 'Un proceso simple y automatizado que beneficia tanto a empresas como empleados'
  },
  'landing.howItWorks.step1.title': { en: 'Company Registration', es: 'Registro de Empresa' },
  'landing.howItWorks.step1.description': { 
    en: 'The company registers, uploads employee information (salaries, IDs, bank details) and defines advance policies.',
    es: 'La empresa se registra, carga la información de empleados (salarios, cédulas, datos bancarios) y define políticas de adelantos.'
  },
  'landing.howItWorks.step2.title': { en: 'Employee Activation', es: 'Activación de Empleados' },
  'landing.howItWorks.step2.description': { 
    en: 'Employees receive an activation code via SMS/Email and can immediately access advance requests based on their worked days.',
    es: 'Los empleados reciben un código de activación por SMS/Email y pueden acceder inmediatamente a solicitar adelantos según sus días trabajados.'
  },
  'landing.howItWorks.step3.title': { en: 'Automatic Advances', es: 'Adelantos Automáticos' },
  'landing.howItWorks.step3.description': { 
    en: 'Requests are automatically approved if within limit (80% earned). Batch payments at 11:00 AM and 3:00 PM.',
    es: 'Las solicitudes se aprueban automáticamente si están dentro del límite (80% devengado). Pagos en lotes a las 11:00 AM y 3:00 PM.'
  },

  // Landing Page - Features
  'landing.features.title': { en: 'Features Designed for Venezuela', es: 'Características Diseñadas para Venezuela' },
  'landing.features.subtitle': { 
    en: 'LOTTT compliance, complete banking integration and the best experience for employees and companies',
    es: 'Cumplimiento LOTTT, integración bancaria completa y la mejor experiencia para empleados y empresas'
  },
  'landing.features.pagomovil.title': { en: 'PagoMóvil & Banks', es: 'PagoMóvil & Bancos' },
  'landing.features.pagomovil.description': { 
    en: 'Compatible with all Venezuelan banks: Mercantil, Venezuela, Banesco, Provincial and more. Instant PagoMóvil.',
    es: 'Compatible con todos los bancos venezolanos: Mercantil, Venezuela, Banesco, Provincial y más. PagoMóvil instantáneo.'
  },
  'landing.features.compliance.title': { en: 'LOTTT Compliance', es: 'Cumplimiento LOTTT' },
  'landing.features.compliance.description': { 
    en: 'Specifically designed to comply with Venezuelan Labor Law. Automatic KYC and legal reports.',
    es: 'Diseñado específicamente para cumplir con la Ley Orgánica del Trabajo venezolana. KYC automático y reportes legales.'
  },
  'landing.features.batches.title': { en: 'Automatic Batches', es: 'Lotes Automáticos' },
  'landing.features.batches.description': { 
    en: 'Batch processing twice daily (11:00 AM and 3:00 PM) for maximum efficiency and lower operational costs.',
    es: 'Procesamiento en lotes dos veces al día (11:00 AM y 3:00 PM) para máxima eficiencia y menores costos operativos.'
  },

  // Login Page
  'login.title': { en: 'Welcome Back', es: 'Bienvenido de Vuelta' },
  'login.subtitle': { en: 'Sign in to your account', es: 'Inicia sesión en tu cuenta' },
  'login.email': { en: 'Email', es: 'Correo' },
  'login.password': { en: 'Password', es: 'Contraseña' },
  'login.submit': { en: 'Sign In', es: 'Iniciar Sesión' },
  'login.noAccount': { en: "Don't have an account?", es: '¿No tienes una cuenta?' },
  'login.signUp': { en: 'Sign up', es: 'Regístrate' },
  'login.incorrectPassword': { en: 'Incorrect Password', es: 'Contraseña Incorrecta' },
  'login.incorrectPasswordDesc': { en: 'The password you entered is incorrect. Please try again.', es: 'La contraseña que ingresaste es incorrecta. Por favor intenta de nuevo.' },
  'permission.denied.title': { en: 'Access Denied', es: 'Acceso Denegado' },
  'permission.denied.message': { en: 'You do not have permission to access this page.', es: 'No tienes permisos para acceder a esta página.' },
  'permission.denied.employee': { en: 'This page is only accessible to employees. You are currently logged in as a {userRole}.', es: 'Esta página solo es accesible para empleados. Actualmente has iniciado sesión como {userRole}.' },
  'permission.denied.company': { en: 'This page is only accessible to company representatives. You are currently logged in as a {userRole}.', es: 'Esta página solo es accesible para representantes de empresa. Actualmente has iniciado sesión como {userRole}.' },
  'permission.denied.operator': { en: 'This page is only accessible to platform operators. You are currently logged in as a {userRole}.', es: 'Esta página solo es accesible para operadores de plataforma. Actualmente has iniciado sesión como {userRole}.' },
  'permission.denied.contactAdmin': { en: 'Please contact your administrator if you believe this is an error.', es: 'Por favor contacta a tu administrador si crees que esto es un error.' },
  'permission.denied.goBack': { en: 'Go Back', es: 'Volver' },
  'permission.denied.logout': { en: 'Logout', es: 'Cerrar Sesión' },

  // Register Page
  'register.title': { en: 'Create Account', es: 'Crear Cuenta' },
  'register.subtitle': { en: 'Get started with your free account', es: 'Comienza con tu cuenta gratuita' },
  'register.fullName': { en: 'Full Name', es: 'Nombre Completo' },
  'register.email': { en: 'Email', es: 'Correo' },
  'register.password': { en: 'Password', es: 'Contraseña' },
  'register.confirmPassword': { en: 'Confirm Password', es: 'Confirmar Contraseña' },
  'register.userType': { en: 'I am a', es: 'Soy un' },
  'register.employee': { en: 'Employee', es: 'Empleado' },
  'register.company': { en: 'Company', es: 'Representante de Empresa' },
  // 'register.company': { en: 'Company Representative', es: 'Representante de Empresa' },

  'register.operator': { en: 'Platform Operator', es: 'Operador de Plataforma' },
  'register.submit': { en: 'Create Account', es: 'Crear Cuenta' },
  'register.hasAccount': { en: 'Already have an account?', es: '¿Ya tienes una cuenta?' },
  'register.signIn': { en: 'Sign in', es: 'Inicia sesión' },

  // FAQ Page
  'faq.title': { en: 'Frequently Asked Questions', es: 'Preguntas Frecuentes' },
  'faq.subtitle': { en: 'Everything you need to know about payroll advances', es: 'Todo lo que necesitas saber sobre adelantos de nómina' },
  'faq.categories.employees': { en: 'For Employees', es: 'Para Empleados' },
  'faq.categories.companies': { en: 'For Companies', es: 'Para Empresas' },
  'faq.categories.security': { en: 'Security and Legal', es: 'Seguridad y Legal' },
  'faq.categories.technical': { en: 'Technical and Support', es: 'Técnico y Soporte' },
  'faq.questionsCount': { en: 'questions', es: 'preguntas' },
  'faq.support.title': { en: "Didn't find your answer?", es: '¿No encontraste tu respuesta?' },
  'faq.support.description': { en: 'Our support team is available 24/7 to help you', es: 'Nuestro equipo de soporte está disponible 24/7 para ayudarte' },
  'faq.quickLinks': { en: 'Useful links', es: 'Enlaces útiles' },

  // About Page
  'about.title': { en: 'About AvancePay', es: 'Acerca de AvancePay' },
  'about.subtitle': { en: 'We are a Venezuelan company that democratizes access to salary advances, helping workers and companies have greater financial flexibility.', es: 'Somos una empresa venezolana que democratiza el acceso a adelantos salariales, ayudando a trabajadores y empresas a tener mayor flexibilidad financiera.' },
  'about.badge': { en: '🇻🇪 Made in Venezuela, for Venezuelans', es: '🇻🇪 Hecho en Venezuela, para venezolanos' },
  'about.mission.title': { en: 'Our Mission', es: 'Nuestra Misión' },
  'about.vision.title': { en: 'Our Vision', es: 'Nuestra Visión' },
  'about.values.title': { en: 'Our Values', es: 'Nuestros Valores' },
  'about.values.subtitle': { en: 'The principles that guide every decision we make', es: 'Los principios que guían cada decisión que tomamos' },
  'about.history.title': { en: 'Our Story', es: 'Nuestra Historia' },
  'about.history.subtitle': { en: 'The path towards democratizing salary advances', es: 'El camino hacia la democratización de los adelantos salariales' },
  'about.compliance.title': { en: 'Compliance and Regulations', es: 'Cumplimiento y Regulaciones' },
  'about.compliance.subtitle': { en: 'We operate under the Venezuelan legal framework with the highest standards', es: 'Operamos bajo el marco legal venezolano con los más altos estándares' },
  'about.cta.title': { en: 'Ready to get started?', es: '¿Listo para comenzar?' },
  'about.cta.description': { en: 'Join the companies that already trust AvancePay to provide financial flexibility to their employees', es: 'Únete a las empresas que ya confían en AvancePay para brindar flexibilidad financiera a sus empleados' },
  'about.cta.contact': { en: 'Contact Sales', es: 'Contactar Ventas' },

  // Contact Page
  'contact.title': { en: 'Contact Us', es: 'Contáctanos' },
  'contact.subtitle': { en: 'Have questions about AvancePay? Our team is here to help you. Contact us and we will respond as soon as possible.', es: '¿Tienes preguntas sobre AvancePay? Nuestro equipo está aquí para ayudarte. Contáctanos y te responderemos lo antes posible.' },
  'contact.form.title': { en: 'Send us a message', es: 'Envíanos un mensaje' },
  'contact.form.description': { en: 'Fill out the form and we will get in touch with you', es: 'Completa el formulario y nos pondremos en contacto contigo' },
  'contact.form.fullName': { en: 'Full name *', es: 'Nombre completo *' },
  'contact.form.namePlaceholder': { en: 'Your name', es: 'Tu nombre' },
  'contact.form.emailPlaceholder': { en: 'your@email.com', es: 'tu@email.com' },
  'contact.form.company': { en: 'Company', es: 'Empresa' },
  'contact.form.companyPlaceholder': { en: 'Your company name', es: 'Nombre de tu empresa' },
  'contact.form.phone': { en: 'Phone', es: 'Teléfono' },
  'contact.form.queryType': { en: 'Type of inquiry *', es: 'Tipo de consulta *' },
  'contact.form.queryTypePlaceholder': { en: 'Select the type of inquiry', es: 'Selecciona el tipo de consulta' },
  'contact.form.subject': { en: 'Subject *', es: 'Asunto *' },
  'contact.form.subjectPlaceholder': { en: 'How can we help you?', es: '¿En qué podemos ayudarte?' },
  'contact.form.message': { en: 'Message *', es: 'Mensaje *' },
  'contact.form.messagePlaceholder': { en: 'Tell us more details about your inquiry...', es: 'Cuéntanos más detalles sobre tu consulta...' },
  'contact.form.sending': { en: 'Sending...', es: 'Enviando...' },
  'contact.form.send': { en: 'Send Message', es: 'Enviar Mensaje' },
  'contact.channels.title': { en: 'Contact Channels', es: 'Canales de Contacto' },
  'contact.channels.description': { en: 'Multiple ways to communicate with us', es: 'Múltiples formas de comunicarte con nosotros' },
  'contact.offices.title': { en: 'Our Offices', es: 'Nuestras Oficinas' },
  'contact.offices.description': { en: 'Main locations in Venezuela', es: 'Ubicaciones principales en Venezuela' },
  'contact.responseTime.title': { en: 'Response Times', es: 'Tiempos de Respuesta' },
  'contact.faq.title': { en: 'Looking for quick answers?', es: '¿Buscas respuestas rápidas?' },
  'contact.faq.description': { en: 'Visit our frequently asked questions section where you will find answers to the most common questions about AvancePay.', es: 'Visita nuestra sección de preguntas frecuentes donde encontrarás respuestas a las dudas más comunes sobre AvancePay.' },
  'contact.faq.link': { en: 'View FAQ', es: 'Ver Preguntas Frecuentes' },

  // Terms Page
  'terms.title': { en: 'Terms of Service', es: 'Términos de Servicio' },
  'terms.subtitle': { en: 'Terms and conditions governing the use of the AvancePay platform in Venezuela', es: 'Condiciones y términos que rigen el uso de la plataforma AvancePay en Venezuela' },
  'terms.lastUpdated': { en: 'Last updated: September 2024', es: 'Última actualización: Septiembre 2024' },
  'terms.version': { en: 'Version 1.0', es: 'Versión 1.0' },
  'terms.legalNotice': { en: 'Important Legal Notice', es: 'Aviso Legal Importante' },
  'terms.modifications': { en: 'Modifications to Terms', es: 'Modificaciones a los Términos' },
  'terms.questionsTitle': { en: 'Questions about the Terms?', es: '¿Preguntas sobre los Términos?' },
  'terms.questionsDescription': { en: 'If you have questions about these terms of service, contact our legal team', es: 'Si tienes dudas sobre estos términos de servicio, contacta a nuestro equipo legal' },

  // Privacy Page
  'privacy.title': { en: 'Privacy Policy', es: 'Política de Privacidad' },
  'privacy.subtitle': { en: 'How AvancePay collects, uses and protects your personal information in compliance with Venezuelan data protection laws', es: 'Cómo AvancePay recolecta, usa y protege tu información personal en cumplimiento con las leyes venezolanas de protección de datos' },
  'privacy.commitment': { en: 'Our Commitment:', es: 'Nuestro Compromiso:' },
  'privacy.collection.title': { en: 'Information We Collect', es: 'Información que Recolectamos' },
  'privacy.collection.description': { en: 'We collect only the information necessary to provide our services', es: 'Recolectamos únicamente la información necesaria para proporcionar nuestros servicios' },
  'privacy.usage.title': { en: 'How We Use Your Information', es: 'Cómo Usamos tu Información' },
  'privacy.usage.description': { en: 'Your information is used exclusively for the following purposes', es: 'Tu información se utiliza exclusivamente para los siguientes propósitos' },
  'privacy.security.title': { en: 'Security Measures', es: 'Medidas de Seguridad' },
  'privacy.security.description': { en: 'We implement multiple layers of security to protect your information', es: 'Implementamos múltiples capas de seguridad para proteger tu información' },
  'privacy.sharing.title': { en: 'Information Sharing', es: 'Compartir Información' },
  'privacy.sharing.description': { en: 'When and with whom we share your personal information', es: 'Cuándo y con quién compartimos tu información personal' },
  'privacy.rights.title': { en: 'Your Rights', es: 'Tus Derechos' },
  'privacy.rights.description': { en: 'As a user of AvancePay, you have the following rights over your personal information', es: 'Como usuario de AvancePay, tienes los siguientes derechos sobre tu información personal' },
  'privacy.retention.title': { en: 'Data Retention', es: 'Retención de Datos' },
  'privacy.retention.description': { en: 'How long we keep your personal information', es: 'Cuánto tiempo conservamos tu información personal' },
  'privacy.contact.title': { en: 'Privacy Questions?', es: '¿Preguntas sobre Privacidad?' },
  'privacy.contact.description': { en: 'Our Data Protection Officer is available to resolve any questions about the handling of your personal information.', es: 'Nuestro Oficial de Protección de Datos está disponible para resolver cualquier duda sobre el manejo de tu información personal.' },
  'privacy.contact.dpo': { en: 'Contact DPO', es: 'Contactar DPO' },

  // Not Found Page
  'notFound.title': { en: 'Page Not Found', es: 'Página No Encontrada' },
  'notFound.subtitle': { en: 'The page you are looking for does not exist', es: 'La página que buscas no existe' },
  'notFound.backHome': { en: 'Back to Home', es: 'Volver al Inicio' },

  // Common
  'common.loading': { en: 'Loading...', es: 'Cargando...' },
  'common.error': { en: 'Error', es: 'Error' },
  'common.success': { en: 'Success', es: 'Éxito' },
  'common.cancel': { en: 'Cancel', es: 'Cancelar' },
  'common.save': { en: 'Save', es: 'Guardar' },
  'common.edit': { en: 'Edit', es: 'Editar' },
  'common.delete': { en: 'Delete', es: 'Eliminar' },
  'common.continue': { en: 'Continue', es: 'Continuar' },
  'common.back': { en: 'Back', es: 'Atrás' },
  'common.next': { en: 'Next', es: 'Siguiente' },
  'common.previous': { en: 'Previous', es: 'Anterior' },
  'common.close': { en: 'Close', es: 'Cerrar' },
  'common.open': { en: 'Open', es: 'Abrir' },
  'common.yes': { en: 'Yes', es: 'Sí' },
  'common.no': { en: 'No', es: 'No' },
  'common.pending': { en: 'pending', es: 'pendiente' },



  // Dashboard common
  'dashboard.welcome': { en: 'Welcome', es: 'Bienvenido' },
  'dashboard.logout': { en: 'Logout', es: 'Cerrar Sesión' },
  'dashboard.profile': { en: 'Profile', es: 'Perfil' },
  'dashboard.settings': { en: 'Settings', es: 'Configuración' },

  // Language switcher
  'language.english': { en: 'English', es: 'Inglés' },
  'language.spanish': { en: 'Spanish', es: 'Español' },
  'language.switch': { en: 'Switch Language', es: 'Cambiar Idioma' },

  // Dashboard Pages
  'employee.dashboard.title': { en: 'Employee Dashboard', es: 'Panel de Empleado' },
  'company.dashboard.title': { en: 'Company Dashboard', es: 'Panel de Empresa' },
  'operator.dashboard.title': { en: 'Operator Dashboard', es: 'Panel de Operador' },

  // Employee Dashboard
  'employee.welcome': { en: 'Hi, {name}!', es: '¡Hola, {name}!' },
  'employee.panel': { en: 'Employee Panel', es: 'Panel de Empleado' },
  'employee.availableAdvance': { en: 'Available for Advance', es: 'Disponible para Adelanto' },
  'employee.ofEarned': { en: '80% of ${amount} earned', es: '80% de ${amount} devengados' },
  'employee.monthlySalary': { en: 'Monthly Salary', es: 'Salario Mensual' },
  'employee.daysWorked': { en: '{worked} of {total} days worked', es: '{worked} de {total} días trabajados' },
  'employee.advancesUsed': { en: 'Advances Used', es: 'Adelantos Usados' },
  'employee.thisPeriod': { en: 'This period', es: 'Este período' },
  'employee.pending': { en: 'Pending', es: 'Pendientes' },
  'employee.advanceInProcess': { en: 'Advance in process', es: 'Adelanto en proceso' },
  'employee.requestAdvance': { en: 'Request Advance', es: 'Solicitar Adelanto' },
  'employee.requestDescription': { en: 'Request an advance of your earned salary instantly', es: 'Solicita un adelanto de tu salario devengado de forma instantánea' },
  'employee.daysWorkedMonth': { en: 'Days worked this month', es: 'Días trabajados este mes' },
  'employee.days': { en: 'days', es: 'días' },
  'employee.availableAmount': { en: 'Available amount', es: 'Monto disponible' },
  'employee.newAdvance': { en: 'New Advance', es: 'Nuevo Adelanto' },
  'employee.requestedAmount': { en: 'Requested amount:', es: 'Monto solicitado:' },
  'employee.maximum': { en: 'Maximum', es: 'Máximo' },
  'employee.amountToRequest': { en: 'Amount to request', es: 'Monto a solicitar' },
  'employee.grossAmount': { en: 'Gross amount:', es: 'Monto bruto:' },
  'employee.commission': { en: 'Commission (5%):', es: 'Comisión (5%):' },
  'employee.youWillReceive': { en: 'You will receive:', es: 'Recibirás:' },
  'employee.requestButton': { en: 'Request Advance', es: 'Solicitar Adelanto' },
  'employee.advanceHistory': { en: 'Advance History', es: 'Historial de Adelantos' },
  'employee.export': { en: 'Export', es: 'Exportar' },
  'employee.inProcess': { en: 'In process', es: 'En proceso' },
  'employee.completed': { en: 'Completed', es: 'Completado' },
  'employee.paymentMethods': { en: 'Payment Methods', es: 'Métodos de Pago' },
  'employee.main': { en: 'Main', es: 'Principal' },
  'employee.backup': { en: 'Backup', es: 'Respaldo' },
  'employee.paymentNote': { en: 'Only your company can modify these payment methods', es: 'Solo tu empresa puede modificar estos métodos de pago' },
  'employee.nextPayroll': { en: 'Next Payroll', es: 'Próxima Nómina' },
  'employee.willDeduct': { en: 'Will deduct', es: 'Se descontarán' },
  'employee.advances': { en: 'advances', es: 'de adelantos' },
  'employee.needHelp': { en: 'Need help?', es: '¿Necesitas ayuda?' },
  'employee.supportDescription': { en: 'Our team is available to resolve your questions', es: 'Nuestro equipo está disponible para resolver tus dudas' },
  'employee.contactSupport': { en: 'Contact Support', es: 'Contactar Soporte' },
  'employee.today': { en: 'Today', es: 'Hoy' },
  'employee.ago': { en: 'ago', es: 'Hace' },
  'employee.week': { en: 'week', es: 'semana' },
  'employee.daysCount': { en: 'days', es: 'días' },

  // Company Dashboard
  'company.panel': { en: 'Company Panel', es: 'Panel Empresarial' },
  'company.configuration': { en: 'Configuration', es: 'Configuración' },
  'company.activeEmployees': { en: 'Active Employees', es: 'Empleados Activos' },
  'company.monthlyFees': { en: 'USD/month in fees', es: 'USD/mes en comisiones' },
  'company.advancesThisMonth': { en: 'Advances This Month', es: 'Adelantos Este Mes' },
  'company.vsLastMonth': { en: 'vs last month', es: 'respecto al mes anterior' },
  'company.pendingApproval': { en: 'Advances awaiting approval', es: 'Adelantos esperando aprobación' },
  'company.weeklyBilling': { en: 'Weekly Billing', es: 'Facturación Semanal' },
  'company.nextBill': { en: 'Next bill:', es: 'Próxima factura:' },
  'company.advances': { en: 'Advances', es: 'Adelantos' },
  'company.employees': { en: 'Employees', es: 'Empleados' },
  'company.reports': { en: 'Reports', es: 'Reportes' },
  'company.billing': { en: 'Billing', es: 'Facturación' },
  'company.recentAdvances': { en: 'Recent Advances', es: 'Adelantos Recientes' },
  'company.manageAdvances': { en: 'Manage advance requests from your employees', es: 'Gestiona las solicitudes de adelanto de tus empleados' },
  'company.filter': { en: 'Filter', es: 'Filtrar' },
  'company.request': { en: 'Request', es: 'Solicitud' },
  'company.reject': { en: 'Reject', es: 'Rechazar' },
  'company.approve': { en: 'Approve', es: 'Aprobar' },
  'company.approved': { en: 'Approved', es: 'Aprobado' },
  'company.employeeManagement': { en: 'Employee Management', es: 'Gestión de Empleados' },
  'company.managePayroll': { en: 'Manage your payroll and registered employees', es: 'Administra tu nómina y empleados registrados' },
  'company.searchEmployee': { en: 'Search employee...', es: 'Buscar empleado...' },
  'company.addEmployee': { en: 'Add Employee', es: 'Agregar Empleado' },
  'company.month': { en: '/month', es: '/mes' },
  'company.lastAdvance': { en: 'Last advance:', es: 'Último adelanto:' },
  'company.active': { en: 'Active', es: 'Activo' },
  'company.never': { en: 'Never', es: 'Nunca' },
  'company.advanceReport': { en: 'Advance Report', es: 'Reporte de Adelantos' },
  'company.downloadReport': { en: 'Download the detailed report for your payroll system', es: 'Descarga el reporte detallado para tu sistema de nómina' },
  'company.period': { en: 'Period:', es: 'Período:' },
  'company.includesAll': { en: 'Includes all advances, commissions and deductions', es: 'Incluye todos los adelantos, comisiones y deducciones' },
  'company.downloadCSV': { en: 'Download CSV', es: 'Descargar CSV' },
  'company.usageAnalysis': { en: 'Usage Analysis', es: 'Análisis de Uso' },
  'company.usageStats': { en: 'Usage statistics of advances per employee', es: 'Estadísticas de uso de adelantos por empleado' },
  'company.monthlyAverage': { en: 'Monthly average:', es: 'Promedio mensual:' },
  'company.employeesUse': { en: 'of employees use the platform', es: 'de empleados usan la plataforma' },
  'company.viewFullReport': { en: 'View Full Report', es: 'Ver Reporte Completo' },
  'company.billingPayments': { en: 'Billing and Payments', es: 'Facturación y Pagos' },
  'company.manageBills': { en: 'Manage your bills and pending payments', es: 'Gestiona tus facturas y pagos pendientes' },
  'company.nextInvoice': { en: 'Next Invoice', es: 'Próxima Factura' },
  'company.due': { en: 'Due:', es: 'Vence:' },
  'company.monthlyCommissions': { en: 'Monthly Commissions', es: 'Comisiones Mensuales' },
  'company.activeEmployeesCount': { en: 'active employees', es: 'empleados activos' },
  'company.totalYear': { en: 'Total Year', es: 'Total Año' },
  'company.vsPreviousYear': { en: 'vs previous year', es: 'vs año anterior' },
  'company.recentInvoices': { en: 'Recent Invoices', es: 'Facturas Recientes' },
  'company.invoice': { en: 'Invoice', es: 'Factura' },
  'company.paid': { en: 'Paid', es: 'Pagada' },

  // Operator Dashboard
  'operator.operationsCenter': { en: 'Operations Center', es: 'Centro de Operaciones' },
  'operator.operatorPanel': { en: 'Operator Panel', es: 'Panel del Operador' },
  'operator.nextBatch': { en: 'Next batch:', es: 'Próximo lote:' },
  'operator.pendingTransfers': { en: 'Pending Transfers', es: 'Transferencias Pendientes' },
  'operator.totalAmount': { en: 'USD total', es: 'USD total' },
  'operator.processedToday': { en: 'Processed Today', es: 'Procesadas Hoy' },
  'operator.exceptions': { en: 'Exceptions', es: 'Excepciones' },
  'operator.manualAttention': { en: 'Require manual attention', es: 'Requieren atención manual' },
  'operator.reconciliation': { en: 'Reconciliation', es: 'Reconciliación' },
  'operator.unconfirmedBatches': { en: 'Unconfirmed batches', es: 'Lotes sin confirmar' },
  'operator.currentBatch': { en: 'Current Batch', es: 'Lote Actual' },
  'operator.history': { en: 'History', es: 'Historial' },
  'operator.batchTime': { en: 'Batch at', es: 'Lote de las' },
  'operator.preparingTransfers': { en: 'Preparing transfers for next processing', es: 'Preparando transferencias para el próximo procesamiento' },
  'operator.batchProgress': { en: 'Batch progress', es: 'Progreso del lote' },
  'operator.transfers': { en: 'transfers', es: 'transferencias' },
  'operator.generateCSV': { en: 'Generate CSV for Bank', es: 'Generar CSV para Banco' },
  'operator.generatePagoMovil': { en: 'Generate PagoMóvil', es: 'Generar PagoMóvil' },
  'operator.transfersQueue': { en: 'Transfers in Queue', es: 'Transferencias en Cola' },
  'operator.approvedTransfers': { en: 'List of all approved transfers for the next batch', es: 'Lista de todas las transferencias aprobadas para el próximo lote' },
  'operator.transferReconciliation': { en: 'Transfer Reconciliation', es: 'Reconciliación de Transferencias' },
  'operator.confirmTransfers': { en: 'Confirm executed transfers by uploading bank receipts', es: 'Confirma las transferencias ejecutadas subiendo los comprobantes bancarios' },
  'operator.uploadConfirmations': { en: 'Upload Bank Confirmations', es: 'Subir Confirmaciones Bancarias' },
  'operator.dragFile': { en: 'Drag your CSV file here', es: 'Arrastra tu archivo CSV aquí' },
  'operator.clickSelect': { en: 'or click to select', es: 'o haz clic para seleccionar' },
  'operator.selectFile': { en: 'Select File', es: 'Seleccionar Archivo' },
  'operator.pendingConfirmation': { en: 'Batches Pending Confirmation', es: 'Lotes Pendientes de Confirmar' },
  'operator.waiting': { en: 'Waiting', es: 'Esperando' },
  'operator.confirmed': { en: 'Confirmed', es: 'Confirmado' },
  'operator.csvInstructions': { en: 'CSV Format Instructions', es: 'Instrucciones de Formato CSV' },
  'operator.requiredColumns': { en: 'Required columns: reference, amount, status, date', es: 'Columnas requeridas: referencia, monto, estado, fecha' },
  'operator.validStates': { en: 'Valid states: "successful", "failed", "pending"', es: 'Estado válidos: "exitoso", "fallido", "pendiente"' },
  'operator.csvColumns': { en: 'Required columns: reference, amount, status, date', es: 'Columnas requeridas: referencia, monto, estado, fecha' },
  'operator.csvStates': { en: 'Valid states: "successful", "failed", "pending"', es: 'Estados válidos: "exitoso", "fallido", "pendiente"' },
  'operator.csvReference': { en: 'Reference must match transfer ID', es: 'La referencia debe coincidir con el ID de transferencia' },
  'operator.exceptionsHeader': { en: 'Transfers with Exceptions', es: 'Transferencias con Excepciones' },
  'operator.exceptionsDescription': { en: 'Review and resolvWhen logging in, if the registered user enters an incorrect password, display a notification stating that the password is incorrect.e failed transfers', es: 'Revisa y resuelve las transferencias que fallaron' },
  'operator.editButton': { en: 'Edit', es: 'Editar' },
  'operator.retryButton': { en: 'Retry', es: 'Reintentar' },
  'operator.historyTitle': { en: 'Operations History', es: 'Historial de Operaciones' },
  'operator.historyDescription': { en: 'Complete record of all processed batches', es: 'Registro completo de todos los lotes procesados' },
  'operator.exportHistoryButton': { en: 'Export History', es: 'Exportar Historial' },
  'operator.batchTime11': { en: 'Batch 15:00 PM - Today', es: 'Lote 15:00 PM - Hoy' },
  'operator.batchTime15': { en: 'Batch 11:00 AM - Today', es: 'Lote 11:00 AM - Hoy' },
  'operator.completed': { en: 'Completed', es: 'Completado' },

  // Common Dashboard Settings
  'dashboard.settings.title': { en: 'Settings', es: 'Configuración' },
  'dashboard.settings.profile': { en: 'Profile Settings', es: 'Configuración de Perfil' },
  'dashboard.settings.language': { en: 'Language Preferences', es: 'Preferencias de Idioma' },
  'dashboard.settings.notifications': { en: 'Notifications', es: 'Notificaciones' },
  'dashboard.settings.security': { en: 'Security', es: 'Seguridad' },
  'dashboard.settings.account': { en: 'Account Settings', es: 'Configuración de Cuenta' },
  'dashboard.settings.preferences': { en: 'Preferences', es: 'Preferencias' },
  'dashboard.settings.theme': { en: 'Theme', es: 'Tema' },
  'dashboard.settings.privacy': { en: 'Privacy', es: 'Privacidad' },
  'dashboard.settings.billing': { en: 'Billing & Payment', es: 'Facturación y Pago' },
  'dashboard.settings.support': { en: 'Support', es: 'Soporte' },
  'dashboard.settings.documentation': { en: 'Documentation', es: 'Documentación' },
  'dashboard.settings.feedback': { en: 'Feedback', es: 'Comentarios' },
  'dashboard.settings.help': { en: 'Help Center', es: 'Centro de Ayuda' },
  'dashboard.settings.about': { en: 'About', es: 'Acerca de' },

  // Success Messages
  'contact.success.title': { en: 'Message sent!', es: '¡Mensaje enviado!' },
  'contact.success.description': { en: 'Thank you for contacting us. We will respond within the next 4 hours.', es: 'Gracias por contactarnos. Te responderemos en las próximas 4 horas.' },

  // Company Configuration
  'config.title': { en: 'Configuration', es: 'Configuración' },
  'config.subtitle': { en: 'Manage your company settings', es: 'Gestiona la configuración de tu empresa' },
  'config.backToDashboard': { en: 'Back to Dashboard', es: 'Volver al Panel' },
  'config.saveChanges': { en: 'Save Changes', es: 'Guardar Cambios' },
  'config.saving': { en: 'Saving...', es: 'Guardando...' },
  'config.settingsSaved': { en: 'Settings saved', es: 'Configuración guardada' },
  'config.settingsSavedDesc': { en: 'Changes have been applied successfully', es: 'Los cambios han sido aplicados exitosamente' },
  'config.tabs.company': { en: 'Company', es: 'Empresa' },
  'config.tabs.payment': { en: 'Payments', es: 'Pagos' },
  'config.tabs.notifications': { en: 'Notifications', es: 'Notificaciones' },
  'config.tabs.security': { en: 'Security', es: 'Seguridad' },
  'config.tabs.integrations': { en: 'Integrations', es: 'Integraciones' },
  'config.company.title': { en: 'Company Information', es: 'Información de la Empresa' },
  'config.company.subtitle': { en: 'Update your company basic information', es: 'Actualiza los datos básicos de tu empresa' },
  'config.company.businessName': { en: 'Business Name', es: 'Razón Social' },
  'config.company.rif': { en: 'RIF', es: 'RIF' },
  'config.company.email': { en: 'Email', es: 'Correo Electrónico' },
  'config.company.phone': { en: 'Phone', es: 'Teléfono' },
  'config.company.addressTitle': { en: 'Address', es: 'Dirección' },
  'config.company.address': { en: 'Address', es: 'Dirección' },
  'config.company.city': { en: 'City', es: 'Ciudad' },
  'config.company.state': { en: 'State', es: 'Estado' },
  'config.company.postalCode': { en: 'Postal Code', es: 'Código Postal' },
  'config.payment.title': { en: 'Payment Methods', es: 'Métodos de Pago' },
  'config.payment.subtitle': { en: 'Configure payment methods for advances and billing', es: 'Configura los métodos de pago para adelantos y facturación' },
  'config.payment.advanceMethodsTitle': { en: 'Methods for Advances', es: 'Métodos para Adelantos' },
  'config.payment.pagoMovil': { en: 'PagoMóvil', es: 'PagoMóvil' },
  'config.payment.instantPayments': { en: 'Instant payments', es: 'Pagos instantáneos' },
  'config.payment.bankTransfer': { en: 'Bank Transfer', es: 'Transferencia Bancaria' },
  'config.payment.bankVenezuela': { en: 'Banco Venezuela', es: 'Banco Venezuela' },
  'config.payment.active': { en: 'Active', es: 'Activo' },
  'config.payment.configure': { en: 'Configure', es: 'Configurar' },
  'config.payment.commissionsTitle': { en: 'Commission Settings', es: 'Configuración de Comisiones' },
  'config.payment.commissionRate': { en: 'Commission Rate (%)', es: 'Tasa de Comisión (%)' },
  'config.payment.minCommission': { en: 'Minimum Commission (USD)', es: 'Comisión Mínima (USD)' },
  'config.notifications.title': { en: 'Notifications', es: 'Notificaciones' },
  'config.notifications.subtitle': { en: 'Customize how and when to receive notifications', es: 'Personaliza cómo y cuándo recibir notificaciones' },
  'config.notifications.advanceRequestsEmail': { en: 'Advance Requests by Email', es: 'Solicitudes de Adelanto por Email' },
  'config.notifications.advanceRequestsEmailDesc': { en: 'Receive an email when there are new requests', es: 'Recibe un email cuando hay nuevas solicitudes' },
  'config.notifications.advanceRequestsSms': { en: 'Advance Requests by SMS', es: 'Solicitudes de Adelanto por SMS' },
  'config.notifications.advanceRequestsSmsDesc': { en: 'Receive SMS for urgent requests', es: 'Recibe SMS para solicitudes urgentes' },
  'config.notifications.weeklyReports': { en: 'Weekly Reports', es: 'Reportes Semanales' },
  'config.notifications.weeklyReportsDesc': { en: 'Weekly activity summary', es: 'Resumen semanal de actividad' },
  'config.notifications.billingNotifications': { en: 'Billing Notifications', es: 'Notificaciones de Facturación' },
  'config.notifications.billingNotificationsDesc': { en: 'Payment and invoice reminders', es: 'Recordatorios de pagos y facturas' },
  'config.notifications.pushNotifications': { en: 'Push Notifications', es: 'Notificaciones Push' },
  'config.notifications.pushNotificationsDesc': { en: 'Real-time notifications in the browser', es: 'Notificaciones en tiempo real en el navegador' },
  'config.security.title': { en: 'Security', es: 'Seguridad' },
  'config.security.subtitle': { en: 'Configure security options for your account', es: 'Configura las opciones de seguridad para tu cuenta' },
  'config.security.twoFactorAuth': { en: 'Two-Factor Authentication', es: 'Autenticación de Dos Factores' },
  'config.security.twoFactorAuthDesc': { en: 'Add an extra layer of security', es: 'Añade una capa extra de seguridad' },
  'config.security.loginNotifications': { en: 'Login Notifications', es: 'Notificaciones de Inicio de Sesión' },
  'config.security.loginNotificationsDesc': { en: 'Email when someone accesses your account', es: 'Email cuando alguien accede a tu cuenta' },
  'config.security.sessionTimeout': { en: 'Session Timeout (minutes)', es: 'Tiempo de Sesión (minutos)' },
  'config.security.approvalAmount': { en: 'Required Approval Amount (USD)', es: 'Monto de Aprobación Requerida (USD)' },
  'config.integrations.title': { en: 'Integrations', es: 'Integraciones' },
  'config.integrations.subtitle': { en: 'Connect AvancePay with your existing systems', es: 'Conecta AvancePay con tus sistemas existentes' },
  'config.integrations.payrollSystem': { en: 'Payroll System', es: 'Sistema de Nómina' },
  'config.integrations.payrollSystemDesc': { en: 'Integrate with your payroll system to automate advances', es: 'Integra con tu sistema de nómina para automatizar adelantos' },
  'config.integrations.hrSystem': { en: 'HR System', es: 'Sistema de RRHH' },
  'config.integrations.hrSystemDesc': { en: 'Connect with your human resources system', es: 'Conecta con tu sistema de recursos humanos' },
  'config.integrations.bankingApi': { en: 'Banking API', es: 'API Bancaria' },
  'config.integrations.bankingApiDesc': { en: 'Direct integration with banks for transfers', es: 'Integración directa con bancos para transferencias' },
  'config.integrations.connect': { en: 'Connect', es: 'Conectar' },
  'config.integrations.connected': { en: 'Connected', es: 'Conectado' },
  'config.integrations.disconnect': { en: 'Disconnect', es: 'Desconectar' },
  'config.integrations.testConnection': { en: 'Test Connection', es: 'Probar Conexión' },
};

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Get from localStorage or default to Spanish (Venezuelan market)
    const saved = localStorage.getItem('language') as Language;
    return saved || 'es';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language] || translation.es || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};