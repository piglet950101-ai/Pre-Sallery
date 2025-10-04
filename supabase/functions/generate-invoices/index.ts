// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  } as Record<string, string>;
}

type BillingPeriod = {
  periodKey: string; // e.g. 2025-10-01-14
  description: string; // e.g. "1st-14th of month"
  startISO: string; // inclusive
  endISO: string;   // inclusive
  dueISO: string;   // due date (15th)
  invoiceNumber: string; // e.g. INV-2025-10-01
};

function getFirstHalfPeriod(now = new Date()): BillingPeriod {
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month, 14);
  const due = new Date(year, month, 15);
  const invoiceNumber = `INV-${year}-${String(month + 1).padStart(2, '0')}-01`;
  return {
    periodKey: `${year}-${String(month + 1).padStart(2, '0')}-01-14`,
    description: '1st-14th of month',
    startISO: start.toISOString(),
    endISO: new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).toISOString(),
    dueISO: due.toISOString(),
    invoiceNumber,
  };
}

function getSecondHalfPeriod(now = new Date()): BillingPeriod {
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const start = new Date(year, month, 15);
  const end = new Date(year, month, lastDay);
  const due = new Date(year, month, lastDay);
  const invoiceNumber = `INV-${year}-${String(month + 1).padStart(2, '0')}-02`;
  return {
    periodKey: `${year}-${String(month + 1).padStart(2, '0')}-15-${String(lastDay).padStart(2, '0')}`,
    description: '15th-end of month',
    startISO: start.toISOString(),
    endISO: new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).toISOString(),
    dueISO: due.toISOString(),
    invoiceNumber,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors() });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Allow override for testing: { runDate: 'YYYY-MM-DD' }
    let body: any = {};
    try { body = await req.json(); } catch {}
    const now = body?.runDate ? new Date(`${body.runDate}T00:00:00Z`) : new Date();

    // Decide which run it is: 15th-run (1–14) or last-day-run (15–end)
    const day = now.getUTCDate();
    const lastDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
    const is15th = day === 15;
    const isLastDay = day === lastDayOfMonth;
    const forced = body?.force === true;
    // if (!forced && !is15th && !isLastDay) {
    //   return new Response(JSON.stringify({ success: false, message: 'Not a billing day, skipping' }), { status: 200, headers: { "Content-Type": "application/json", ...cors() } });
    // }

    const isSecondHalf = forced ? (body?.half === 'second') : isLastDay;
    const period = isSecondHalf ? getSecondHalfPeriod(now) : getFirstHalfPeriod(now);

    // Fetch all companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, rif, is_approved');
    if (companiesError) throw companiesError;

    const startISO = period.startISO;
    const endISO = period.endISO;

    let created = 0;
    let skipped = 0;
    for (const company of companies || []) {
      if (!company?.id || company.is_approved === false) { skipped++; continue; }

      // Idempotency: skip if invoice already exists for this company and periodKey
      const { data: existing, error: existingErr } = await supabase
        .from('company_payments')
        .select('id')
        .eq('company_id', company.id)
        .eq('period', period.periodKey)
        .maybeSingle();
      if (existingErr) throw existingErr;
      if (existing) { skipped++; continue; }

      // Sum completed/completada advances in the window
      const { data: advances, error: advErr } = await supabase
        .from('advance_transactions')
        .select('requested_amount, fee_amount, status, created_at')
        .eq('company_id', company.id)
        .gte('created_at', startISO)
        .lte('created_at', endISO)
        .in('status', ['completed', 'completada']);
      if (advErr) throw advErr;

      const advancesAmount = (advances || []).reduce((sum: number, a: any) => sum + Number(a.requested_amount || 0), 0);
      const commissionFees = (advances || []).reduce((sum: number, a: any) => sum + Number(a.fee_amount || 0), 0);

      // $1 per active employee (monthly) charged in second-half invoice (end-of-month)
      let employeeFees = 0;
      if (isSecondHalf) {
        const { data: employees, error: empErr } = await supabase
          .from('employees')
          .select('id, is_active')
          .eq('company_id', company.id)
          .eq('is_active', true);
        if (empErr) throw empErr;
        employeeFees = (employees?.length || 0) * 1.0;
      }

      const amount = Number((advancesAmount + commissionFees + employeeFees).toFixed(2));
      if (amount <= 0) { skipped++; continue; }

      const insertPayload = {
        company_id: company.id,
        amount,
        status: 'pending',
        payment_method: null,
        payment_details: null,
        paid_date: null,
        invoice_number: period.invoiceNumber,
        period: period.periodKey,
        due_date: period.dueISO.split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Record<string, any>;

      const { error: insErr } = await supabase.from('company_payments').insert(insertPayload);
      if (insErr) throw insErr;
      created++;
    }

    return new Response(JSON.stringify({ success: true, created, skipped, period }), { status: 200, headers: { "Content-Type": "application/json", ...cors() } });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { "Content-Type": "application/json", ...cors() } });
  }
});


