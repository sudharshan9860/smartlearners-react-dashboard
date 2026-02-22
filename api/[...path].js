export default async function handler(req, res) {
  const path = Array.isArray(req.query.path)
    ? req.query.path.join("/")
    : req.query.path;

  const url = `https://autogen.aieducator.com/api/${path}`;

  const response = await fetch(url, {
    method: req.method,
    headers: {
      "Content-Type": req.headers["content-type"] || "application/json",
      Authorization: req.headers["authorization"] || "",
    },
    body:
      req.method !== "GET" && req.method !== "HEAD"
        ? JSON.stringify(req.body)
        : undefined,
  });

  const text = await response.text();
  res.status(response.status).send(text);
}
