// Keep generated HTML readable without altering JavaScript or preformatted text.
export function formatHTML(html) {
    const rawBlocks = [];
    html = html.replace(/<(script|style|pre|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi, block => {
        rawBlocks.push(block);
        return `__RAW_BLOCK_${rawBlocks.length - 1}__`;
    });
    html = html.replace(/>\s*</g, '>\n<')
        .replace(/(__RAW_BLOCK_\d+__)/g, '\n$1\n');
    const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
    let depth = 0;
    const lines = html.split(/\r?\n/).map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        const closesFirst = /^<\//.test(trimmed);
        const indent = Math.max(0, depth - (closesFirst ? 1 : 0));
        for (const match of trimmed.matchAll(/<(\/?)([a-z][\w-]*)\b[^>]*>/gi)) {
            if (match[1]) depth = Math.max(0, depth - 1);
            else if (!voidTags.has(match[2].toLowerCase()) && !match[0].endsWith('/>')) depth++;
        }
        return '    '.repeat(indent) + trimmed;
    });
    return lines.join('\n').replace(/__RAW_BLOCK_(\d+)__/g, (_, index) => rawBlocks[Number(index)])
        .replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
