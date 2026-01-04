// Script para actualizar eventos antiguos en master_closed_events y agregar el campo points a cada objeto de tip_distribution
// Ejecuta este script en un entorno Node.js con acceso a Supabase

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'TU_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'TU_SERVICE_ROLE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateOldEvents() {
  // 1. Obtener todos los eventos
  const { data: events, error } = await supabase
    .from('master_closed_events')
    .select('id, tip_distribution');

  if (error) {
    console.error('Error fetching events:', error);
    return;
  }

  for (const event of events) {
    if (!event.tip_distribution) continue;
    let updated = false;
    const newTipDist = event.tip_distribution.map((emp: any) => {
      if (emp.points === undefined) {
        // Puedes cambiar la lógica aquí si quieres calcular points de otra forma
        const points = 0;
        updated = true;
        return { ...emp, points };
      }
      return emp;
    });
    if (updated) {
      const { error: updateError } = await supabase
        .from('master_closed_events')
        .update({ tip_distribution: newTipDist })
        .eq('id', event.id);
      if (updateError) {
        console.error(`Error updating event ${event.id}:`, updateError);
      } else {
        console.log(`Event ${event.id} updated.`);
      }
    }
  }
  console.log('Actualización completada.');
}

updateOldEvents();
