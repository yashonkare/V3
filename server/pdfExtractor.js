import pdf from 'pdf-parse';

/**
 * Extracts text from a PDF buffer while capturing per-page boundaries.
 * @param {Buffer} pdfBuffer - Uploaded PDF file buffer
 * @returns {Promise<{ totalPages: number, pages: Array<{ pageNumber: number, text: string }>, fullText: string }>}
 */
export async function extractTextWithPages(pdfBuffer) {
  const pages = [];

  // pdf-parse pagerender hook to track individual page contents
  const options = {
    pagerender: function (pageData) {
      return pageData.getTextContent().then(function (textContent) {
        let lastY, text = '';
        for (let item of textContent.items) {
          if (lastY == item.transform[5] || !lastY) {
            text += item.str;
          } else {
            text += '\n' + item.str;
          }
          lastY = item.transform[5];
        }
        
        pages.push({
          pageNumber: pages.length + 1,
          text: text.trim()
        });

        return text;
      });
    }
  };

  const parsed = await pdf(pdfBuffer, options);

  // If pagerender didn't populate for any edge case, fallback to parsed pages count
  const totalPages = parsed.numpages || (pages.length > 0 ? pages.length : 1);
  const fullText = parsed.text || pages.map(p => p.text).join('\n\n');

  return {
    totalPages,
    pages,
    fullText
  };
}
