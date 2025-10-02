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
  
  if (existing) {
    // Update existing record with any new data (especially rif_image_url)
    const updateData: any = {};
    if (data.rif_image_url !== undefined) updateData.rif_image_url = data.rif_image_url;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.rif !== undefined) updateData.rif = data.rif;
    
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


