export function crawlerMeta(html) {
 // Undo the blanket indexing restriction and unsupported AI directives.
 // Preserve deliberate directives such as noindex,follow on the homepage redirect.
 return html.replace(/<meta\b[^>]*>/gi,tag=>{
  const name=tag.match(/\bname\s*=\s*["']([^"']+)["']/i)?.[1].toLowerCase();
  const content=tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i)?.[1].toLowerCase();
  if(name==='robots' && content?.replace(/\s/g,'')==='noindex,nofollow') return '';
  if(['googlebot','bingbot','anthropic-ai','openai','perplexity-ai'].includes(name) && content==='noai') return '';
  return tag;
 });
}
