export default async function handler(req, res) {
  const targetPath = req.url.replace("/api/proxy", "");
  const url = `https://autogen.aieducator.com${targetPath}`;

  const response = await fetch(url, {
    method: req.method,
    headers: {
      "Content-Type": req.headers["content-type"] || "application/json",
      Authorization: req.headers["authorization"] || "",
    },
    body: req.method !== "GET" ? req.body : undefined,
  });

  const text = await response.text();
  res.status(response.status).send(text);
}
