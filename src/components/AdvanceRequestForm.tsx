import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  DollarSign, 
  Clock, 
  Calculator, 
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Shield,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

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
  onAdvanceSubmitted?: () => void;
  existingAdvanceRequests?: any[];
}

export const AdvanceRequestForm = ({ employeeData, onAdvanceSubmitted, existingAdvanceRequests = [] }: AdvanceRequestFormProps) => {
  const [requestAmount, setRequestAmount] = useState<number>(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { toast } = useToast();

  const feeRate = 0.05; // 5%
  const minFee = 1; // $1 minimum
  const maxAvailable = employeeData.availableAmount;

  // Check if there's already a pending or processing advance
  // Allow new requests if the previous advance was rejected (failed) or completed
  const hasPendingAdvance = existingAdvanceRequests.some(
    request => request.status === 'pending' || request.status === 'processing' || request.status === 'approved'
  );

  // Check if there's a recent rejected advance to show helpful message
  const hasRejectedAdvance = existingAdvanceRequests.some(
    request => request.status === 'failed'
  );

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

  const handleSubmit = () => {
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

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setIsSubmitting(true);
      setShowConfirmModal(false);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      // Get employee data
      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select("id, company_id, phone, bank_name, account_number")
        .eq("auth_user_id", user.id)
        .single();

      if (employeeError || !employee) {
        throw new Error("No se encontró la información del empleado");
      }

      // Calculate amounts
      const feeAmount = calculateFee(requestAmount);
      const netAmount = requestAmount - feeAmount;

      // Create advance request
      const { error: requestError } = await supabase
        .from("advance_transactions")
        .insert({
          employee_id: employee.id,
          company_id: employee.company_id,
          requested_amount: requestAmount,
          fee_amount: feeAmount,
          net_amount: netAmount,
          earned_wages: employeeData.earnedAmount,
          available_amount: employeeData.availableAmount,
          worked_days: employeeData.workedDays,
          total_days: employeeData.totalDays,
          payment_method: employee.phone ? 'pagomovil' : 'bank_transfer',
          payment_details: employee.phone || employee.account_number,
          status: 'pending'
        });

      if (requestError) {
        throw new Error(`Error al crear la solicitud: ${requestError.message}`);
      }

      toast({
        title: "Solicitud enviada",
        description: "Tu adelanto será procesado en el próximo lote (11:00 AM o 3:00 PM)",
      });

      // Reset form
      setRequestAmount(50);
      
      // Refresh advance history
      if (onAdvanceSubmitted) {
        onAdvanceSubmitted();
      }

    } catch (error: any) {
      console.error("Error creating advance request:", error);
      toast({
        title: "Error",
        description: error?.message ?? "No se pudo enviar la solicitud",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
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

          {/* Pending Advance Warning */}
          {hasPendingAdvance && (
            <div className="flex items-start space-x-3 p-4 bg-orange-100 border border-orange-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-orange-800">Solicitud en Progreso</div>
                <div className="text-orange-700">
                  Ya tienes una solicitud de adelanto pendiente o en procesamiento. 
                  No puedes solicitar un nuevo adelanto hasta que se complete la solicitud actual.
                </div>
              </div>
            </div>
          )}

          {/* Rejected Advance Info */}
          {hasRejectedAdvance && !hasPendingAdvance && (
            <div className="flex items-start space-x-3 p-4 bg-blue-100 border border-blue-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-blue-800">Listo para Nueva Solicitud</div>
                <div className="text-blue-700">
                  Tu solicitud anterior fue rechazada. Puedes solicitar un nuevo adelanto ahora.
                </div>
              </div>
            </div>
          )}
          
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
                    disabled={hasPendingAdvance}
                    className="transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={hasPendingAdvance}
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
              disabled={isSubmitting || requestAmount <= 0 || requestAmount > maxAvailable || hasPendingAdvance}
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

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Confirmar Solicitud de Adelanto</span>
            </DialogTitle>
            <DialogDescription>
              Por favor, revisa los detalles de tu solicitud antes de confirmar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Employee Info */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-2">Empleado</div>
              <div className="text-lg font-semibold">{employeeData.name}</div>
            </div>

            {/* Request Details */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Monto solicitado:</span>
                <span className="text-lg font-semibold">${requestAmount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Comisión (5%):</span>
                <span className="text-sm text-destructive">-${calculateFee(requestAmount).toFixed(2)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold">Recibirás:</span>
                <span className="text-xl font-bold text-primary">${netAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Processing Info */}
            <div className="bg-primary/10 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-primary">Procesamiento</div>
                  <div className="text-muted-foreground">
                    Tu adelanto será procesado en el próximo lote (11:00 AM o 3:00 PM) y recibirás el dinero el mismo día.
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="flex-1"
                variant="hero"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Procesando...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Confirmar Solicitud</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};