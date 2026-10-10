/**
 * downloadHelper.js
 * Comprehensive media download and URL normalization utility for cross-origin deployments (Vercel + Render).
 */

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

/**
 * Normalizes any backend-generated URL to prevent Mixed Content errors (HTTP -> HTTPS)
 * and resolves relative endpoints into absolute backend URLs.
 */
export function sanitizeMediaUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';

  let url = rawUrl.trim();

  // If URL is relative (e.g. /processed/xxx.mp4 or /api/download/...)
  if (url.startsWith('/')) {
    url = `${BACKEND_URL}${url}`;
  }

  // Always upgrade remote cloud URLs to HTTPS to prevent Chrome from blocking downloads
  if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    url = url.replace(/^http:\/\//i, 'https://');
  }

  return url;
}

/**
 * Downloads media file reliably across origins.
 * Converts the file to a same-origin Blob URL to ensure the browser's native Save File dialog
 * is always triggered, bypassing cross-origin restrictions on HTML5 `download` attributes.
 *
 * @param {string} rawUrl - Direct download or clean media URL
 * @param {string} fallbackFilename - Filename to save as if Content-Disposition header is absent
 * @returns {Promise<{ success: boolean, filename: string, method: string }>}
 */
export async function downloadMediaFile(rawUrl, fallbackFilename = 'clean-media.mp4') {
  if (!rawUrl) {
    throw new Error('No media URL provided for download.');
  }

  const finalUrl = sanitizeMediaUrl(rawUrl);

  try {
    // 1. Fetch file as Blob with credentials (HttpOnly cookies if authenticated)
    const response = await fetch(finalUrl, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status} when downloading file.`);
    }

    // 2. Resolve download filename
    let filename = fallbackFilename;
    const disposition = response.headers.get('content-disposition');
    if (disposition) {
      const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1].trim());
      }
    }

    // Ensure extension matches
    if (!filename.includes('.')) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('video') || finalUrl.includes('.mp4')) {
        filename += '.mp4';
      } else if (contentType.includes('png') || finalUrl.includes('.png')) {
        filename += '.png';
      } else if (contentType.includes('jpeg') || finalUrl.includes('.jpg')) {
        filename += '.jpg';
      }
    }

    // 3. Convert response stream to same-origin Blob
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    // 4. Create invisible anchor tag to trigger native download prompt
    const anchor = document.createElement('a');
    anchor.style.display = 'none';
    anchor.href = blobUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();

    // 5. Cleanup
    setTimeout(() => {
      if (document.body.contains(anchor)) {
        document.body.removeChild(anchor);
      }
      window.URL.revokeObjectURL(blobUrl);
    }, 2000);

    return { success: true, filename, method: 'blob' };
  } catch (err) {
    console.warn('Direct Blob download failed; attempting browser fallback navigation:', err);

    // Fallback: Use direct browser link navigation in a separate context
    try {
      const fallbackAnchor = document.createElement('a');
      fallbackAnchor.style.display = 'none';
      fallbackAnchor.href = finalUrl;
      fallbackAnchor.download = fallbackFilename;
      fallbackAnchor.target = '_blank';
      fallbackAnchor.rel = 'noopener noreferrer';
      document.body.appendChild(fallbackAnchor);
      fallbackAnchor.click();

      setTimeout(() => {
        if (document.body.contains(fallbackAnchor)) {
          document.body.removeChild(fallbackAnchor);
        }
      }, 1000);

      return { success: true, filename: fallbackFilename, method: 'fallback' };
    } catch (fallbackErr) {
      throw new Error(`Failed to download media: ${err.message || fallbackErr.message}`);
    }
  }
}
