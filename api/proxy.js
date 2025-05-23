export default async function handler(req, res) {
    const { id, type } = req.query;

    // ✅ Validate ID and type
    if (!id || isNaN(id) || (type !== "movie" && type !== "episode")) {
        return res.status(400).json({ error: "Invalid ID or type." });
    }

    const baseEmbedUrl = type === "episode"
        ? `https://vidapi.xyz/embed/tv/${id}`
        : `https://vidapi.xyz/embed/movie/${id}`;

    try {
        const response = await fetch(baseEmbedUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'text/html',
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: "Failed to fetch video source." });
        }

        const html = await response.text();

        // ✅ Extract iframe source
        const match = html.match(/<iframe[^>]+src="([^"]+)"/);
        if (!match || !match[1]) {
            return res.status(500).json({ error: "Failed to extract iframe source." });
        }

        const embedUrl = match[1];

        // ✅ Set headers for better security and caching
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // ✅ Render optimized HTML
        res.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Video Player</title>
                <style>
                    body { margin: 0; background: black; display: flex; justify-content: center; align-items: center; height: 100vh; }
                    iframe { width: 100%; height: 100vh; border: none; }
                </style>
            </head>
            <body>
                <iframe id="vidsrc-frame" src="${embedUrl}" allowfullscreen sandbox="allow-scripts allow-same-origin allow-presentation"></iframe>

                <script>
                    window.addEventListener('load', () => {
                        const iframe = document.getElementById("vidsrc-frame");

                        // ✅ Use MutationObserver for dynamic ad removal
                        const observer = new MutationObserver(() => {
                            try {
                                const iframeDoc = iframe.contentWindow.document;

                                // Remove ad scripts and overlays
                                iframeDoc.querySelectorAll("a, script[src*='ads'], div[class*='ad'], iframe[src*='ads']")
                                    .forEach(el => el.remove());
                            } catch (error) {
                                console.warn("Failed to remove ads:", error);
                            }
                        });

                        // ✅ Observe ad injections continuously
                        const config = { childList: true, subtree: true };
                        observer.observe(iframe, config);
                    });
                </script>
            </body>
            </html>
        `);

        res.end();

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error." });
    }
}
