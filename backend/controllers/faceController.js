const { supabaseAdmin } = require("../config/supabaseClient");
const FACE_ENGINE_SECRET = process.env.FACE_ENGINE_SECRET || "";

/**
 * POST /api/face/enroll-complete
 *
 * Admin only. Called by the React frontend after the Python face engine
 * has successfully captured 100 frames for a student.
 *
 * Body: { sbrn: string }
 *
 * Workflow:
 *  1. Validate SBRN
 *  2. Look up student — must exist and be active
 *  3. Guard: reject if already enrolled
 *  4. Set students.face_enrolled = true WHERE student_id_text = sbrn
 *  5. Set profiles.face_enrolled = true WHERE student_id = sbrn (if column exists)
 *  6. Return { success, student_name, sbrn }
 */
async function enrollComplete(req, res) {
  try {
    const { sbrn } = req.body;

    if (!sbrn || typeof sbrn !== "string" || sbrn.trim().length === 0) {
      return res.status(400).json({
        error: "Validation Error",
        message: "sbrn is required.",
      });
    }

    const normalizedSbrn = sbrn.trim().toUpperCase();

    // 1. Fetch student by SBRN
    const { data: studentRecord, error: fetchError } = await supabaseAdmin
      .from("student_details")
      .select(`
        user_id,
        users!inner(full_name),
        face_embeddings(id)
      `)
      .eq("sbrn", normalizedSbrn)
      .maybeSingle();

    if (fetchError) {
      console.error("[faceController] student lookup error:", fetchError.message);
      throw new Error(fetchError.message);
    }

    if (!studentRecord || !studentRecord.users) {
      return res.status(404).json({
        error: "Not Found",
        message: `No student found with SBRN '${normalizedSbrn}'.`,
      });
    }

    const isEnrolled = studentRecord.face_embeddings && studentRecord.face_embeddings.length > 0;
    const studentName = studentRecord.users.full_name;

    // 2. Guard: already enrolled?
    if (isEnrolled) {
      return res.status(409).json({
        error: "Already Enrolled",
        message: `Student '${studentName}' (${normalizedSbrn}) is already face-enrolled.`,
      });
    }

    // 3. Insert placeholder into face_embeddings (Python engine will sync actual vectors later)
    const { error: faceInsertError } = await supabaseAdmin
      .from("face_embeddings")
      .insert({ user_id: studentRecord.user_id, embedding: [] })
      .select()
      .single();

    if (faceInsertError) {
      console.error("[faceController] face_embeddings update error:", faceInsertError.message);
      throw new Error(faceInsertError.message);
    }

    console.log(
      `[faceController] Face enrollment completed: ${studentName} (${normalizedSbrn}) ` +
      `by admin ${req.user?.email}`
    );

    return res.status(200).json({
      success: true,
      message: `Face enrollment completed for ${studentName}.`,
      student_name: studentName,
      sbrn: normalizedSbrn,
    });
  } catch (err) {
    console.error("[faceController] enrollComplete error:", err.message);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message || "Failed to complete face enrollment.",
    });
  }
}

/**
 * GET /api/face/sync
 * Internal only. Fetches all embeddings for the Python engine startup.
 */
async function getEmbeddings(req, res) {
  try {
    const secret = req.header("X-Face-Engine-Secret");
    if (!FACE_ENGINE_SECRET || secret !== FACE_ENGINE_SECRET) {
      return res.status(403).json({ error: "Forbidden", message: "Invalid secret." });
    }

    const { data, error } = await supabaseAdmin
      .from("face_embeddings")
      .select(`
        embedding,
        users!inner(
          student_details!inner(sbrn)
        )
      `)
      .not("embedding", "eq", "{}");

    if (error) throw error;

    // Filter out empty arrays inserted by enrollComplete placeholder
    const faces = (data || [])
      .filter((row) => row.embedding && row.embedding.length > 0)
      .map((row) => ({
        sbrn: row.users.student_details[0].sbrn,
        embedding: row.embedding
      }));

    return res.status(200).json({ faces });
  } catch (err) {
    console.error("[faceController] getEmbeddings error:", err.message);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
}

/**
 * POST /api/face/sync
 * Internal only. Python engine pushes new embeddings here after enrollment.
 */
async function syncEmbedding(req, res) {
  try {
    const secret = req.header("X-Face-Engine-Secret");
    if (!FACE_ENGINE_SECRET || secret !== FACE_ENGINE_SECRET) {
      return res.status(403).json({ error: "Forbidden", message: "Invalid secret." });
    }

    const { sbrn, embedding, sample_count } = req.body;
    if (!sbrn || !embedding) {
      return res.status(400).json({ error: "Bad Request", message: "sbrn and embedding required." });
    }

    const normalizedSbrn = sbrn.trim().toUpperCase();

    const { data: studentRecord, error: fetchError } = await supabaseAdmin
      .from("student_details")
      .select("user_id")
      .eq("sbrn", normalizedSbrn)
      .maybeSingle();

    if (fetchError || !studentRecord) {
      return res.status(404).json({ error: "Not Found", message: "Student not found." });
    }

    // Since user_id isn't strictly unique in schema but logically 1:1, we delete and insert.
    await supabaseAdmin.from("face_embeddings").delete().eq("user_id", studentRecord.user_id);
    
    const { error: insertError } = await supabaseAdmin
      .from("face_embeddings")
      .insert({
        user_id: studentRecord.user_id,
        embedding,
        sample_count: sample_count || 100,
        model_version: "haar_knn_v1"
      });

    if (insertError) throw insertError;

    return res.status(200).json({ success: true, message: `Synced embedding for ${normalizedSbrn}` });
  } catch (err) {
    console.error("[faceController] syncEmbedding error:", err.message);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
}

module.exports = { enrollComplete, getEmbeddings, syncEmbedding };
