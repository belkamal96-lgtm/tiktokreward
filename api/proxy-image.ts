export default async function handler(req: any, res: any) {
  const { url } = req.query;
  if (!url || typeof url !== "string") {
    return res.status(400).send("URL is required");
  }

  if (url.includes("unavatar.io") || url.includes("ui-avatars.com")) {
    return res.redirect(url);
  }

  try {
    const fetchImage = async (targetUrl: string, refererMode: "tiktok" | "none" | "bytedance") => {
      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache"
      };
      if (refererMode === "tiktok") {
        headers["Referer"] = "https://www.tiktok.com/";
      } else if (refererMode === "bytedance") {
        headers["Referer"] = "https://www.bytedance.com/";
      }
      return await fetch(targetUrl, { headers });
    };

    let response = await fetchImage(url, "tiktok");

    if (!response.ok && response.status === 403) {
      response = await fetchImage(url, "none");
    }

    if (response.ok) {
      const contentType = response.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
      res.setHeader("Access-Control-Allow-Origin", "*");

      const arrayBuffer = await response.arrayBuffer();
      return res.status(200).send(Buffer.from(arrayBuffer));
    }

    return res.redirect(`https://wsrv.nl/?url=${encodeURIComponent(url)}`);
  } catch (error) {
    return res.redirect(`https://wsrv.nl/?url=${encodeURIComponent(url)}`);
  }
}
