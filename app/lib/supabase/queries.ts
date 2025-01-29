import { supabase } from "./client";

export async function checkEmployeeNumber(employeeNumber: string) {
  try {
    const { data, error } = await supabase
      .from("employees")
      .select("employee_number")
      .eq("employee_number", employeeNumber)
      .single();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error("Error checking employee number:", error);
    return false;
  }
}
