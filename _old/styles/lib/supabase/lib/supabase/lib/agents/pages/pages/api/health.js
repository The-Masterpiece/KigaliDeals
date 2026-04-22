export default function handler(req, res) {
  res.status(200).json({
    status: "ok",
    service: "KigaliDeals",
    time: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || "development",
  });
}
