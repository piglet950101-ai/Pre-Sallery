import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="border-t bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} nominero.com. {t('footer.copyright')}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <a href="#" className="hover:text-foreground">{t('footer.support.privacy')}</a>
          <a href="#" className="hover:text-foreground">{t('footer.support.terms')}</a>
          <a href="#" className="hover:text-foreground">{t('footer.support')}</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


