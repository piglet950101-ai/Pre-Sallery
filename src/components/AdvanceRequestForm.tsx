import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, 
  Clock, 
  Calculator, 
  AlertCircle,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmployeeData {
  name: string;
  monthlySalary: number;
  workedDays: number;
  totalDays: number;
  earnedAmount: number;
  availableAmount: number;
  usedAmount: number;
}

interface AdvanceRequestFormProps {
  employeeData: EmployeeData;
}

export const AdvanceRequestForm = ({ employeeData }: AdvanceRequestFormProps) => {
  const [requestAmount, setRequestAmount] = useState<number>(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const feeRate = 0.05; // 5%
  const minFee = 1; // $1 minimum
  const maxAvailable = employeeData.availableAmount;

  const calculateFee = (amount: number) => Math.max(amount * feeRate, minFee);
  const netAmount = requestAmount - calculateFee(requestAmount);

  const quickAmounts = [50, 100, 200, Math.floor(maxAvailable)];

  const handleQuickAmount = (amount: number) => {
    setRequestAmount(Math.min(amount, maxAvailable));
  };

  const handleAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    setRequestAmount(Math.min(amount, maxAvailable));
  };

  const handleSubmit = async () => {
    if (requestAmount > maxAvailable) {
      toast({
        title: "Monto excede el límite",
        description: "El monto solicitado excede tu límite disponible",
        variant: "destructive"
      });
      return;
    }

    if (requestAmount < 20) {
      toast({
        title: "Monto mínimo",
        description: "El adelanto mínimo es de $20 USD",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call to create advance request
    setTimeout(() => {
      toast({
        title: "Solicitud enviada",
        description: "Tu adelanto será procesado en el próximo lote (11:00 AM o 3:00 PM)",
      });
      setIsSubmitting(false);
      setRequestAmount(50);
    }, 2000);
  };

  const progressPercentage = (employeeData.workedDays / employeeData.totalDays) * 100;
  const availablePercentage = (requestAmount / maxAvailable) * 100;

  return (
    <Card className="border-none shadow-elegant animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <span>Solicitar Adelanto</span>
        </CardTitle>
        <CardDescription>
          Solicita un adelanto de tu salario devengado de forma instantánea
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Indicators */}
        <div className="space-y-4">
          <div className="animate-slide-up">
            <div className="flex justify-between text-sm mb-2">
              <span className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Días trabajados este mes</span>
              </span>
              <span className="font-medium">{employeeData.workedDays} / {employeeData.totalDays} días</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex justify-between text-xs mt-1 text-muted-foreground">
              <span>Inicio del mes</span>
              <span>{progressPercentage.toFixed(1)}% completado</span>
            </div>
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex justify-between text-sm mb-2">
              <span className="flex items-center space-x-2">
                <Calculator className="h-4 w-4 text-muted-foreground" />
                <span>Salario devengado</span>
              </span>
              <span className="font-medium">${employeeData.earnedAmount} USD</span>
            </div>
            <Progress value={80} className="h-3" />
            <div className="flex justify-between text-xs mt-1 text-muted-foreground">
              <span>Disponible para adelanto (80%)</span>
              <span>${maxAvailable} USD</span>
            </div>
          </div>
        </div>

        {/* Request Form */}
        <div className="bg-gradient-hero p-6 rounded-lg space-y-6 animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Nuevo Adelanto</h3>
            <Badge variant="secondary" className="animate-pulse-glow">
              Procesamiento automático
            </Badge>
          </div>
          
          <div className="space-y-4">
            {/* Quick Amount Buttons */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Monto rápido:</Label>
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amount, index) => (
                  <Button 
                    key={amount}
                    variant={requestAmount === amount ? "premium" : "outline"}
                    size="sm"
                    onClick={() => handleQuickAmount(amount)}
                    className="transition-all duration-200 hover:scale-105"
                    style={{ animationDelay: `${0.1 * index}s` }}
                  >
                    {amount === Math.floor(maxAvailable) ? 'Máximo' : `$${amount}`}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div>
              <Label htmlFor="custom-amount" className="text-sm font-medium mb-2 block">
                O ingresa un monto personalizado:
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="custom-amount"
                  type="number"
                  value={requestAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="pl-10 h-12 text-lg font-semibold"
                  placeholder="0.00"
                  min="1"
                  max={maxAvailable}
                  step="0.01"
                />
              </div>
              {requestAmount > maxAvailable && (
                <div className="flex items-center space-x-2 mt-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Monto excede el límite disponible</span>
                </div>
              )}
            </div>

            {/* Amount Breakdown */}
            <div className="border rounded-lg p-4 bg-background space-y-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">${requestAmount.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Monto solicitado</div>
              </div>
              
              <Separator />
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Monto bruto:</span>
                  <span className="font-medium">${requestAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Comisión (5%, mín $1):</span>
                  <span className="text-destructive font-medium">-${calculateFee(requestAmount).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Recibirás:</span>
                  <span className="text-primary">${netAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Visual progress of requested amount */}
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Usando del límite disponible</span>
                  <span>{availablePercentage.toFixed(1)}%</span>
                </div>
                <Progress value={availablePercentage} className="h-2" />
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              className="w-full h-12 text-base font-semibold" 
              variant="hero" 
              onClick={handleSubmit}
              disabled={isSubmitting || requestAmount <= 0 || requestAmount > maxAvailable}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Procesando...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Solicitar Adelanto</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>

            {/* Process Info */}
            <div className="flex items-start space-x-3 p-3 bg-primary/10 rounded-lg">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-primary">Procesamiento en lotes</div>
                <div className="text-muted-foreground">
                  Los adelantos se procesan manualmente en 2 lotes diarios: 11:00 AM y 3:00 PM. Recibirás el dinero el mismo día vía PagoMóvil o transferencia bancaria.
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};