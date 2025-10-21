import { supabase } from "@/lib/supabase";

export type CompanyProfile = {
  name?: string;
  rif?: string;
  address?: string;
  phone?: string;
  email?: string;
  rif_image_url?: string;
};

export type EmployeeProfile = {
  email?: string;
  phone?: string;
  activationCode?: string;
};

export async function ensureCompanyRecord(authUserId: string, data: CompanyProfile = {}) {
  // The companies table no longer stores an email column. Ignore any provided email
  const { email: _ignoredEmail, ...companyData } = data;
  const { data: existing, error: selErr } = await supabase
    .from("companies")
    .select("id")
    .eq("auth_user_id", authUserId)
    .limit(1)
    .maybeSingle();
  if (selErr) return { error: selErr };
  
  if (existing) {
    // Update existing record with any new data (especially rif_image_url)
    const updateData: any = {};
    if (companyData.rif_image_url !== undefined) updateData.rif_image_url = companyData.rif_image_url;
    if (companyData.address !== undefined) updateData.address = companyData.address;
    if (companyData.phone !== undefined) updateData.phone = companyData.phone;
    if (companyData.name !== undefined) updateData.name = companyData.name;
    if (companyData.rif !== undefined) updateData.rif = companyData.rif;
    
    // Only update if there's data to update
    if (Object.keys(updateData).length > 0) {
      const { error: updateErr } = await supabase
        .from("companies")
        .update(updateData)
        .eq("auth_user_id", authUserId);
      if (updateErr) return { error: updateErr };
    }
    
    return { data: existing };
  }
  
  // Create new record
  const { data: ins, error: insErr } = await supabase
    .from("companies")
    .insert([{ auth_user_id: authUserId, ...companyData }])
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


