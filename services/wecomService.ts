/**
 * Sends a markdown message to the WeCom Webhook.
 * 
 * Includes a CORS proxy solution to bypass browser restrictions.
 * Automatically splits messages that exceed WeCom's 4096 byte limit.
 */
export const sendToWeCom = async (webhookUrl: string, content: string): Promise<void> => {
  // WeCom limit is 4096 bytes.
  // UTF-8: English = 1 byte, Chinese = 3 bytes.
  // 1300 Chinese characters is roughly 3900 bytes.
  // We use a safe character limit of 1024 to account for formatting overhead, 
  // mixed content, and JSON escaping.
  const CHUNK_SIZE = 1024;

  const chunks: string[] = [];
  
  // Simple splitting strategy: Line by line to preserve formatting.
  // Since our prompt ensures <font> tags and content are on the same line,
  // splitting by newline is safe and won't break markdown syntax.
  const lines = content.split('\n');
  let currentChunk = "";

  for (const line of lines) {
    // Check if adding the next line would exceed the chunk size
    // +1 accounts for the newline character we'll add back
    if ((currentChunk.length + line.length + 1) > CHUNK_SIZE) {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = line;
    } else {
      currentChunk = currentChunk ? currentChunk + '\n' + line : line;
    }
  }
  // Add the final remaining chunk
  if (currentChunk) chunks.push(currentChunk);

  const proxyUrl = "https://corsproxy.io/?"; 
  const targetUrl = proxyUrl + encodeURIComponent(webhookUrl);

  // Send chunks sequentially
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const payload = {
      msgtype: "markdown",
      markdown: { content: chunk }
    };

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
         const text = await response.text();
         throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const data = await response.json();
      
      // WeCom API returns { errcode: 0, ... } on success
      if (data.errcode !== 0) {
        throw new Error(`WeCom API Error (${data.errcode}): ${data.errmsg}`);
      }

      // Small delay to ensure messages arrive in order on the client
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }

    } catch (error) {
      console.error(`Failed to send chunk ${i + 1}/${chunks.length}`, error);
      // Propagate error to the UI so the user can see it and retry
      throw error;
    }
  }
};