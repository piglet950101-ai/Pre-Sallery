import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Company {
  id: string;
  name: string;
}

interface CompanySelectorProps {
  onCompanySelect: (companyId: string) => void;
  selectedCompanyId: string | null;
}

export const CompanySelector = ({ onCompanySelect, selectedCompanyId }: CompanySelectorProps) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('id, name, is_approved')
          .eq('is_approved', true)
          .order('name');

        if (error) throw error;
        setCompanies((data || []).map(({ id, name }) => ({ id, name })));
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor="company-select">{t('register.selectCompany')}</Label>
      <Select
        value={selectedCompanyId || ''}
        onValueChange={onCompanySelect}
        disabled={isLoading}
      >
        <SelectTrigger id="company-select" className="h-12">
          <SelectValue placeholder={t('register.selectCompany')} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {companies.length > 0 ? (
            companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="none" disabled>
              {t('register.noCompaniesFound')}
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};