import { supabase } from "@/lib/supabase";

export type CompanyProfile = {
  name?: string;
  rif?: string;
  address?: string;
  phone?: string;
  email?: string;
};

export type EmployeeProfile = {
  email?: string;
  phone?: string;
  activationCode?: string;
};

export async function ensureCompanyRecord(authUserId: string, data: CompanyProfile = {}) {
  const { data: existing, error: selErr } = await supabase
    .from("companies")
    .select("id")
    .eq("auth_user_id", authUserId)
    .limit(1)
    .maybeSingle();
  if (selErr) return { error: selErr };
  if (existing) return { data: existing };
  const { data: ins, error: insErr } = await supabase
    .from("companies")
    .insert([{ auth_user_id: authUserId, ...data }])
    .select("id")
    .maybeSingle();
  if (insErr) return { error: insErr };
  return { data: ins };
}

export async function ensureEmployeeRecord(authUserId: string, data: EmployeeProfile = {}) {
  const { data: existing, error: selErr } = await supabase
    .from("employees")
    .select("id")
    .eq("auth_user_id", authUserId)
    .limit(1)
    .maybeSingle();
  if (selErr) return { error: selErr };
  if (existing) return { data: existing };
  const { data: ins, error: insErr } = await supabase
    .from("employees")
    .insert([{ auth_user_id: authUserId, ...data }])
    .select("id")
    .maybeSingle();
  if (insErr) return { error: insErr };
  return { data: ins };
}


