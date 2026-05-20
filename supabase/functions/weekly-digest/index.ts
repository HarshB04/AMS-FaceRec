import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get attendance records from the last 7 days
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const dateString = lastWeek.toISOString().split('T')[0];

    const { data: attendance, error: attError } = await supabase
      .from('attendance')
      .select(`
        id,
        date_attended,
        status,
        students ( name, student_id_text ),
        courses ( course_name, teacher )
      `)
      .gte('date_attended', dateString);

    if (attError) throw attError;

    // 2. Group by teacher
    interface TeacherStats {
      present: number;
      absent: number;
      late: number;
      total: number;
    }
    const byTeacher: Record<string, TeacherStats> = {};

    for (const record of (attendance || [])) {
      // Supabase TS infers joined tables as arrays without DB types, but Many-to-One returns an object.
      // Cast through unknown to avoid 'any' type restriction
      const courseData = record.courses as unknown as { teacher: string } | { teacher: string }[] | null;
      
      let teacher = 'Unknown';
      if (Array.isArray(courseData)) {
        teacher = courseData[0]?.teacher || 'Unknown';
      } else if (courseData) {
        teacher = courseData.teacher || 'Unknown';
      }

      if (!byTeacher[teacher]) {
        byTeacher[teacher] = { present: 0, absent: 0, late: 0, total: 0 };
      }
      
      byTeacher[teacher].total++;
      if (record.status === 'present') byTeacher[teacher].present++;
      if (record.status === 'absent') byTeacher[teacher].absent++;
      if (record.status === 'late') byTeacher[teacher].late++;
    }

    // 3. Simulate sending digest emails
    for (const [teacher, stats] of Object.entries(byTeacher)) {
      const rate = ((stats.present / Math.max(stats.total, 1)) * 100).toFixed(1);
      
      const emailPayload = `
      ===============================================
      WEEKLY ATTENDANCE DIGEST FOR: ${teacher}
      ===============================================
      Period: ${dateString} to Today
      Total Records: ${stats.total}
      
      Present: ${stats.present}
      Late:    ${stats.late}
      Absent:  ${stats.absent}
      
      Overall Attendance Rate: ${rate}%
      ===============================================
      `;
      
      // MOCK DISPATCH (In a real scenario, this would use Resend / SendGrid)
      console.log(`[EMAIL DISPATCH SIMULATION] Sending to ${teacher}...`);
      console.log(emailPayload);
    }

    return new Response(
      JSON.stringify({ message: `Successfully generated digests for ${Object.keys(byTeacher).length} teachers.` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Digest generation error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
