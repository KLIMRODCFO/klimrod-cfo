import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertMasterClosedEvent() {
  // Ejemplo de tip_distribution con puntos por empleado
  const tip_distribution = [
    { employee: 'Juan', position: 'Mesero', cc_gratuity: 100, cash_gratuity: 50, points: 17.5 },
    { employee: 'Ana', position: 'Runner', cc_gratuity: 80, cash_gratuity: 20, points: 10 }
  ];

  const event_info = {
    date: '2026-01-04',
    day: 'MONDAY',
    eventName: 'EVENTO EJEMPLO',
    shift: 'DINNER',
    manager: 'Manager Name',
    notes: ''
  };

  const { error } = await supabase.from('master_closed_events').insert([
    {
      report_id: 'example_20260104',
      closed_at: new Date().toISOString(),
      closed_by: 'APP_USER',
      restaurant_id: 'rest_1',
      restaurant_name: 'Restaurante Ejemplo',
      event_date: event_info.date,
      event_day: event_info.day,
      event_name: event_info.eventName,
      shift: event_info.shift,
      manager: event_info.manager,
      event_notes: event_info.notes,
      total_net_sales: 1000,
      total_cash_sales: 400,
      total_cc_sales: 600,
      total_cc_gratuity: 180,
      total_cash_gratuity: 70,
      total_points: 27.5,
      total_gratuity: 250,
      total_expenses: 0,
      total_check: 0,
      total_cash: 0,
      total_business: 0,
      total_employee: 0,
      total_refunded: 0,
      other_fee: 0,
      distribution_method: 'percentage',
      event_info,
      sales_data: [],
      expense_data: [],
      other_fee_data: [],
      tip_distribution,
      performance_report: [],
      event_summary: '',
      status: 'CLOSED',
      version: 1
    }
  ]);

  if (error) {
    console.error('❌ Error inserting event:', error.message);
  } else {
    console.log('✅ Event inserted successfully!');
  }
}

insertMasterClosedEvent();
