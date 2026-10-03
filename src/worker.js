const ADMIN_WA = "573115893220";
const STUDENT_COOKIE = "bt_student";
const securityEnabled = (env) => env.BT_SECURITY_ENABLED !== "0";
const levelGatingEnabled = (env) => env.BT_LEVEL_GATING_ENABLED !== "0";

const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", ...headers },
});
const fail = (message, status = 400) => json({ error: message }, status);
const normalize = (url) => String(url || "").split("#", 1)[0].replace(/\/+$/, "") + "/";
const id = (n = 16) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
const hash = async (value) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))), (b) => b.toString(16).padStart(2, "0")).join("");
const passwordHash = async (password, salt) => {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 120000, hash: "SHA-256" }, key, 256);
  return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, "0")).join("");
};
const constantEqual = (a, b) => {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
};
const secureCookie = (url) => !["localhost", "127.0.0.1", "::1"].includes(url.hostname);
const cookieHeader = (token, url, maxAge = 31536000) => `${STUDENT_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureCookie(url) ? "; Secure" : ""}`;

async function bodyJson(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 64000) throw new Error("Solicitud demasiado grande.");
  const value = await request.json();
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Cuerpo JSON no válido.");
  return value;
}

async function courseLevels(env) {
  if (!globalThis.__btLevels) {
    const response = await env.ASSETS.fetch(new Request("http://assets/data/parsed/course_data.json"));
    if (!response.ok) throw new Error("No se encontró el curso publicado.");
    const data = await response.json();
    globalThis.__btLevels = (data.levels || []).map((level) => ({
      number: Number(level.level),
      urls: [...(level.classes || []), ...(level.video_classes || [])].map((lesson) => normalize(lesson.url)).filter((url) => url !== "/"),
    })).sort((a, b) => a.number - b.number);
  }
  return globalThis.__btLevels;
}

function parseCookie(request) {
  return (request.headers.get("cookie") || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${STUDENT_COOKIE}=`))?.slice(STUDENT_COOKIE.length + 1) || "";
}

async function studentId(request, env) {
  const token = parseCookie(request);
  if (!token) return null;
  const tokenHash = await hash(token), now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare("SELECT student_id AS id FROM student_sessions WHERE token_hash = ? AND expires_at > ?").bind(tokenHash, now).first()
    || await env.DB.prepare("SELECT id FROM students WHERE token_hash = ?").bind(tokenHash).first();
  return row?.id || null;
}

async function issueStudentSession(env, studentId, url, status = 200) {
  const token = id(32), now = Math.floor(Date.now() / 1000);
  await env.DB.prepare("INSERT INTO student_sessions(token_hash, student_id, expires_at) VALUES(?, ?, ?)")
    .bind(await hash(token), studentId, now + 30 * 86400).run();
  return json({ ok: true }, status, { "set-cookie": cookieHeader(token, url, 30 * 86400) });
}

async function snapshot(env, studentId) {
  const [progressRows, unlockRows, requestRows, student] = await Promise.all([
    env.DB.prepare("SELECT lesson_url FROM progress WHERE student_id = ?").bind(studentId).all(),
    env.DB.prepare("SELECT level FROM unlocks WHERE student_id = ?").bind(studentId).all(),
    env.DB.prepare("SELECT id, level, state, created_at FROM approval_requests WHERE student_id = ? ORDER BY created_at DESC").bind(studentId).all(),
    env.DB.prepare("SELECT id, name, phone, email FROM students WHERE id = ?").bind(studentId).first(),
  ]);
  const done = new Set((progressRows.results || []).map((row) => row.lesson_url));
  const unlocked = new Set((unlockRows.results || []).map((row) => Number(row.level)));
  const levels = await courseLevels(env);
  for (let i = 0; i < levels.length; i++) {
    if (i === 0 || unlocked.has(levels[i].number) || levels[i].urls.every((url) => done.has(url))) unlocked.add(levels[i].number);
    else break;
  }
  return { authenticated: Boolean(student?.email), student: student ? { id: student.id, name: student.name, phone: student.phone, email: student.email } : null, doneUrls: [...done].sort(), unlockedLevels: [...unlocked].sort((a, b) => a - b), requests: requestRows.results || [] };
}

async function adminOk(request, env) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare("SELECT token_hash FROM admin_sessions WHERE token_hash = ? AND expires_at > ?").bind(await hash(token), now).first();
  return Boolean(row);
}

async function handleApi(request, env) {
  const url = new URL(request.url), path = url.pathname;
  if (path === "/api/health" && request.method === "GET") return json({ ok: true, storage: "D1" });
  if (path === "/api/student" && request.method === "GET") {
    let sid = await studentId(request, env), token = "";
    if (!sid && !securityEnabled(env)) {
      token = id(32); sid = id(6);
      await env.DB.prepare("INSERT INTO students(id, token_hash, created_at) VALUES(?, ?, ?)")
        .bind(sid, await hash(token), Math.floor(Date.now() / 1000)).run();
    }
    if (!sid) return json({ authenticated: false, authRequired: true, student: null, doneUrls: [], unlockedLevels: [], requests: [] });
    const data = await snapshot(env, sid);
    data.authRequired = securityEnabled(env);
    data.levelGatingEnabled = levelGatingEnabled(env);
    return json(data, 200, token ? { "set-cookie": cookieHeader(token, url) } : {});
  }
  if (path === "/api/auth/signup" && request.method === "POST") {
    if (!securityEnabled(env)) return fail("El registro con contraseña está desactivado en modo de demo local.", 403);
    let body;
    try { body = await bodyJson(request); } catch (e) { return fail(e.message); }
    const name = String(body.name || "").trim().slice(0, 100), email = String(body.email || "").trim().toLowerCase().slice(0, 254);
    const phone = String(body.phone || "").trim().slice(0, 30), password = String(body.password || "");
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 200) return fail("Escribe tu nombre, un correo válido y una contraseña de al menos 8 caracteres.");
    if (await env.DB.prepare("SELECT id FROM students WHERE email = ?").bind(email).first()) return fail("Ese correo ya tiene una cuenta. Inicia sesión.", 409);
    const studentId = id(6), salt = id(16), now = Math.floor(Date.now() / 1000);
    await env.DB.prepare("INSERT INTO students(id, token_hash, name, phone, created_at, email, password_salt, password_hash) VALUES(?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(studentId, await hash(id(32)), name, phone, now, email, salt, await passwordHash(password, salt)).run();
    return issueStudentSession(env, studentId, url, 201);
  }
  if (path === "/api/auth/login" && request.method === "POST") {
    if (!securityEnabled(env)) return fail("El inicio de sesión con contraseña está desactivado en modo de demo local.", 403);
    let body;
    try { body = await bodyJson(request); } catch (e) { return fail(e.message); }
    const email = String(body.email || "").trim().toLowerCase(), password = String(body.password || "");
    const student = await env.DB.prepare("SELECT id, password_salt, password_hash FROM students WHERE email = ?").bind(email).first();
    if (!student || !constantEqual(await passwordHash(password, student.password_salt), student.password_hash)) return fail("Correo o contraseña incorrectos.", 401);
    return issueStudentSession(env, student.id, url);
  }
  if (path === "/api/auth/logout" && request.method === "POST") {
    const token = parseCookie(request);
    if (token) await env.DB.prepare("DELETE FROM student_sessions WHERE token_hash = ?").bind(await hash(token)).run();
    return json({ ok: true }, 200, { "set-cookie": cookieHeader("", url, 0) });
  }
  if (path === "/api/admin/login" && request.method === "POST") {
    if (!securityEnabled(env)) return fail("El acceso del panel está abierto solo en modo de demo local.", 403);
    let body;
    try { body = await bodyJson(request); } catch (e) { return fail(e.message); }
    const supplied = String(body.password || "");
    if (!env.BT_ADMIN_PASSWORD || supplied !== env.BT_ADMIN_PASSWORD) return fail("Contraseña incorrecta.", 401);
    const token = id(32), now = Math.floor(Date.now() / 1000);
    await env.DB.prepare("INSERT INTO admin_sessions(token_hash, expires_at) VALUES(?, ?)").bind(await hash(token), now + 8 * 3600).run();
    return json({ token });
  }
  if (path === "/api/admin/requests" && request.method === "GET") {
    if (!levelGatingEnabled(env)) return json({ requests: [], authRequired: false, disabled: true });
    if (securityEnabled(env) && !await adminOk(request, env)) return fail("Inicia sesión como administrador.", 401);
    const rows = await env.DB.prepare(`SELECT r.id,r.level,r.state,r.created_at,s.id AS student_code,s.name,s.phone,
      (SELECT COUNT(*) FROM progress p WHERE p.student_id=s.id) AS done_count
      FROM approval_requests r JOIN students s ON s.id=r.student_id
      WHERE r.state='pending' ORDER BY r.created_at`).all();
    return json({ requests: rows.results || [], authRequired: securityEnabled(env) });
  }
  const decisionMatch = path.match(/^\/api\/admin\/requests\/([A-Z0-9]+)$/);
  if (decisionMatch && request.method === "POST") {
    if (!levelGatingEnabled(env)) return fail("El control de acceso por niveles está desactivado.", 410);
    if (securityEnabled(env) && !await adminOk(request, env)) return fail("Inicia sesión como administrador.", 401);
    let body;
    try { body = await bodyJson(request); } catch (e) { return fail(e.message); }
    if (!["approve", "deny"].includes(body.decision)) return fail("Decisión no válida.");
    const row = await env.DB.prepare("SELECT student_id, level, state FROM approval_requests WHERE id = ?").bind(decisionMatch[1]).first();
    if (!row || row.state !== "pending") return fail("Solicitud no encontrada o ya revisada.", 404);
    const now = Math.floor(Date.now() / 1000), state = body.decision === "approve" ? "approved" : "denied";
    await env.DB.prepare("UPDATE approval_requests SET state = ?, reviewed_at = ? WHERE id = ?").bind(state, now, decisionMatch[1]).run();
    if (body.decision === "approve") await env.DB.prepare("INSERT OR REPLACE INTO unlocks(student_id, level, request_id, created_at) VALUES(?, ?, ?, ?)").bind(row.student_id, row.level, decisionMatch[1], now).run();
    return json({ ok: true });
  }

  if (path === "/api/chat" && request.method === "POST") {
    let body;
    try { body = await bodyJson(request); } catch (e) { return fail(e.message); }
    if (!env.GROQ_API_KEY) return fail("GROQ_API_KEY no configurada", 500);

    const messages = body.messages || [];
    const systemPrompt = {
      role: "system",
      content: "Eres un experto mentor de trading de opciones binarias exclusivo para la plataforma Binomo. Tu único propósito es enseñar sobre lectura de velas, patrones chartistas y los indicadores: RSI, MACD, Fractals, Momentum, Bollinger Bands, Fibonacci, Alligator, etc. Si el usuario pregunta algo fuera del trading o de estas herramientas, debes negarte cortésmente a responder y redirigir la conversación al trading."
    };
    
    try {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [systemPrompt, ...messages],
          temperature: 0.7
        })
      });
      const groqData = await groqRes.json();
      return json({ reply: groqData.choices[0].message.content });
    } catch(err) {
      return fail(err.message, 500);
    }
  }

  const sid = await studentId(request, env);
  if (!sid) return fail("Sesión de alumno no encontrada. Recarga el curso.", 401);
  if (request.method !== "POST") return fail("Ruta API no encontrada.", 404);
  let body;
  try { body = await bodyJson(request); } catch (e) { return fail(e.message); }
  if (path === "/api/progress") {
    const raw = body.doneUrls || [];
    if (!Array.isArray(raw) || raw.length > 200) return fail("Progreso no válido.");
    const levels = await courseLevels(env), current = await snapshot(env, sid);
    const requested = new Set(raw.filter((value) => typeof value === "string").map(normalize));
    const doneSet = new Set(current.doneUrls);
    const allowed = new Set(levels.flatMap((level) => level.urls));
    if (!levelGatingEnabled(env)) {
      for (const url of requested) if (allowed.has(url)) doneSet.add(url);
    } else {
      for (const level of levels) {
        if (level.number !== levels[0]?.number && !level.urls.every((url) => doneSet.has(url))) {
          const manual = current.unlockedLevels.includes(level.number);
          if (!manual) break;
        }
        for (const url of level.urls) if (requested.has(url)) doneSet.add(url);
      }
    }
    const done = [...doneSet];
    const statements = [env.DB.prepare("DELETE FROM progress WHERE student_id = ?").bind(sid), ...done.map((url) => env.DB.prepare("INSERT INTO progress(student_id, lesson_url, updated_at) VALUES(?, ?, ?) ON CONFLICT(student_id,lesson_url) DO UPDATE SET updated_at=excluded.updated_at").bind(sid, url, Math.floor(Date.now() / 1000)))];
    await env.DB.batch(statements);
    return json(await snapshot(env, sid));
  }
  if (path === "/api/requests") {
    if (!levelGatingEnabled(env)) return fail("El control de acceso por niveles está desactivado.", 410);
    const level = Number(body.level), levels = await courseLevels(env), state = await snapshot(env, sid);
    const next = levels.find((item) => !state.unlockedLevels.includes(item.number))?.number;
    if (!levels.some((item) => item.number === level) || level !== next) return fail("Solo se puede solicitar el siguiente nivel bloqueado.", 409);
    const name = String(body.name || "").trim().slice(0, 100), phone = String(body.phone || "").trim().slice(0, 30);
    if (!name || phone.replace(/\D/g, "").length < 7) return fail("Escribe tu nombre y WhatsApp para la solicitud.");
    await env.DB.prepare("UPDATE students SET name = ?, phone = ? WHERE id = ?").bind(name, phone, sid).run();
    let existing = await env.DB.prepare("SELECT id FROM approval_requests WHERE student_id = ? AND level = ? AND state = 'pending'").bind(sid, level).first();
    const requestId = existing?.id || id(5), now = Math.floor(Date.now() / 1000);
    if (!existing) await env.DB.prepare("INSERT INTO approval_requests(id, student_id, level, created_at) VALUES(?, ?, ?, ?)").bind(requestId, sid, level, now).run();
    const counts = levels.map((item) => `Nivel ${item.number}: ${item.urls.filter((url) => state.doneUrls.includes(url)).length}/${item.urls.length}`).join(", ");
    const message = `Hola, solicito autorización para continuar al Nivel ${level}. Código alumno: ${sid}. Solicitud: ${requestId}. Progreso: ${counts}. Mi nombre: ${name}. Mi WhatsApp: ${phone}.`;
    return json({ requestId, whatsappUrl: `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(message)}` }, 201);
  }
  return fail("Ruta API no encontrada.", 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/") return Response.redirect(new URL("/public/", url), 302);
    if (url.pathname.startsWith("/api/")) {
      try { return await handleApi(request, env); }
      catch (error) { console.error("API error", error); return fail("Error interno del servidor.", 500); }
    }
    return env.ASSETS.fetch(request);
  },
};
