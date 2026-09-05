exports.handler = async function(event) {

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  var APIKEY = process.env.GEMINI_KEY;

  var incoming = JSON.parse(event.body);
  var contractText = incoming.contract;

  if (!contractText || contractText.length < 100) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Contract text too short." })
    };
  }

  var prompt = "You are ContractClear, an expert AI that protects freelance developers and designers from predatory contracts. Analyze the following contract and identify every clause that could harm the freelancer.\n\nLook for:\n- Work-for-hire language transferring ownership to client\n- IP assignment clauses handing over codebase or design systems\n- Claims on pre-existing work the freelancer already owned\n- Portfolio restrictions\n- Overly broad non-compete clauses\n- Derivative works language\n- NDA clauses preventing freelancer from describing their own skills\n\nRespond using exactly these headers:\n\nRISK SCORE: [LOW or MEDIUM or HIGH or CRITICAL]\n\nSUMMARY:\n[2 to 3 plain English sentences]\n\nRED FLAG CLAUSES:\n[Each starting with a dash, topic, colon, explanation]\n\nWATCH OUT FOR:\n[Each starting with a dash. If none write: None.]\n\nWHAT TO NEGOTIATE:\n[3 to 5 specific changes, each starting with a dash]\n\nCONTRACT TEXT:\n" + contractText;

  var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" + APIKEY;

  try {
    var response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    var data = await response.json();

    if (!response.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: data.error ? data.error.message : "API error" })
      };
    }

    var resultText = data.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result: resultText })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};