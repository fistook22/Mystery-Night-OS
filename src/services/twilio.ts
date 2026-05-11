import https from "https";
import { Buffer } from "buffer";

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

function twilioRequest(path: string, body: URLSearchParams): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const payload = body.toString();
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
    const options = {
      hostname: "api.twilio.com",
      path,
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(payload),
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

export async function initiateCall(toPhone: string, script: string, callerName: string): Promise<unknown> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.log(`[Twilio MOCK] Calling: ${toPhone}`);
    console.log(`[Twilio MOCK] Script: ${script}`);
    return { mock: true };
  }

  // TwiML that reads the script using AI voice
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural" language="en-US">
    ${script.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] ?? c))}
  </Say>
</Response>`;

  const params = new URLSearchParams({
    To: toPhone,
    From: TWILIO_PHONE_NUMBER,
    Twiml: twiml,
    CallerId: callerName,
  });

  return twilioRequest(
    `/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`,
    params
  );
}
