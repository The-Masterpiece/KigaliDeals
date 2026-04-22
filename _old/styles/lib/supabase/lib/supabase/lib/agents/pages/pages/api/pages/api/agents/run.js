import { supabaseAdmin } from "@/lib/supabase/admin";
import { calcCost } from "@/lib/agents/anthropic";

// Agent registry - handlers added in Phase 4
const AGENTS = {
  // 'merchant': merchantAgent,
  // 'content':  contentAgent,
  // 'support':  supportAgent,
  // 'growth':   growthAgent,
  // 'analyst':  analystAgent,
  // 'trust':    trustAgent,
};

export default async function handler(req, res) {
  // Protect the endpoint: only Vercel Cron (with the secret) can trigger it
  const authHeader = req.headers.authorization || "";
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const BATCH_SIZE = 5;

  try {
    // 1. Find pending tasks that are due to run
    const { data: pending, error: pendError } = await supabaseAdmin
      .from("agent_tasks")
      .select("id")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (pendError) throw pendError;
    if (!pending || pending.length === 0) {
      return res.status(200).json({ message: "no pending tasks" });
    }

    const ids = pending.map((p) => p.id);

    // 2. Claim them (mark as running)
    const { data: claimed, error: claimError } = await supabaseAdmin
      .from("agent_tasks")
      .update({ status: "running", started_at: new Date().toISOString() })
      .in("id", ids)
      .select("*");

    if (claimError) throw claimError;

    const processed = [];

    // 3. Process each claimed task
    for (const task of claimed) {
      const handlerFn = AGENTS[task.agent];
      const startTime = Date.now();

      if (!handlerFn) {
        await supabaseAdmin
          .from("agent_tasks")
          .update({
            status: "failed",
            error: `no handler registered for agent '${task.agent}'`,
            completed_at: new Date().toISOString(),
          })
          .eq("id", task.id);

        processed.push({ id: task.id, status: "no_handler", agent: task.agent });
        continue;
      }

      try {
        const result = await handlerFn(task);
        const latency = Date.now() - startTime;

        // Log the run
        await supabaseAdmin.from("agent_runs").insert({
          task_id: task.id,
          agent: task.agent,
          action: task.action,
          model: result.model || null,
          input_tokens: result.input_tokens || null,
          output_tokens: result.output_tokens || null,
          cost_usd:
            result.model && result.input_tokens != null && result.output_tokens != null
              ? calcCost(result.model, result.input_tokens, result.output_tokens)
              : null,
          latency_ms: latency,
          status: result.success ? "success" : "error",
          input: task.payload,
          output: result.output || null,
          error: result.error || null,
        });

        if (result.success) {
          await supabaseAdmin
            .from("agent_tasks")
            .update({
              status: "done",
              result: result.output || null,
              completed_at: new Date().toISOString(),
            })
            .eq("id", task.id);
          processed.push({ id: task.id, status: "done", agent: task.agent });
        } else {
          // Retry with exponential backoff
          const nextAttempt = task.attempts + 1;
          const shouldRetry = nextAttempt < task.max_attempts;
          const nextRun = new Date(Date.now() + 60_000 * Math.pow(2, task.attempts));

          await supabaseAdmin
            .from("agent_tasks")
            .update({
              status: shouldRetry ? "pending" : "failed",
              attempts: nextAttempt,
              error: result.error || "unknown error",
              scheduled_for: shouldRetry ? nextRun.toISOString() : undefined,
              started_at: null,
              completed_at: shouldRetry ? null : new Date().toISOString(),
            })
            .eq("id", task.id);

          processed.push({
            id: task.id,
            status: shouldRetry ? "retry" : "failed",
            agent: task.agent,
          });
        }
      } catch (err) {
        console.error(`agent ${task.agent} crashed:`, err);
        await supabaseAdmin
          .from("agent_tasks")
          .update({
            status: "failed",
            attempts: task.attempts + 1,
            error: err.message || String(err),
            completed_at: new Date().toISOString(),
          })
          .eq("id", task.id);

        processed.push({ id: task.id, status: "crashed", agent: task.agent });
      }
    }

    return res.status(200).json({ processed });
  } catch (err) {
    console.error("dispatcher error:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}

// Increase serverless function timeout for agent work
export const config = {
  maxDuration: 60,
};
