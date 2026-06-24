const sections = [
  {
    name: "I'm working on..",
    items: [
      "https://intrasti.com"
    ]
  },
  {
    name: "I've made..",
    items: [
      "https://dismoji.me",
      "https://md.jeremyjaydan.au",
      "https://brain.jeremyjaydan.au",
      "https://code.jeremyjaydan.au"
    ]
  }
];

// Helper to guess the MIME type based on the file extension
function getMimeType(url) {
  const extMatch = url.match(/\.(png|ico|jpg|jpeg|svg|gif)(\?.*)?$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'ico';
  
  const mimeTypes = {
    png: 'image/png',
    ico: 'image/x-icon',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    svg: 'image/svg+xml',
    gif: 'image/gif'
  };

  return mimeTypes[ext] || 'image/x-icon';
}

const data = [];

for (const section of sections) {
  const currentSection = {
    name: section.name,
    items: []
  };

  for (const item of section.items) {
    console.log('Fetching:', item);
    const urlObj = new URL(item);
    
    try {
      const response = await fetch(item);
      const text = await response.text();

      // Extract Title
      const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : "No title found";

      // Extract Meta Description
      const descMatch = text.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) || 
                        text.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
      const description = descMatch ? descMatch[1].trim() : "No description found";

      // Extract Favicon URL
      const favMatch = text.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["']/i);
      let remoteFaviconUrl = favMatch ? favMatch[1] : "/favicon.ico";
      
      // Resolve relative paths
      if (remoteFaviconUrl && !remoteFaviconUrl.startsWith('http')) {
        remoteFaviconUrl = `${urlObj.origin}${remoteFaviconUrl.startsWith('/') ? '' : '/'}${remoteFaviconUrl}`;
      }

      let base64Favicon = "";

      // Fetch favicon binary and convert to a Base64 Data URL
      try {
        console.log(`Downloading favicon for inlining: ${remoteFaviconUrl}`);
        const favResponse = await fetch(remoteFaviconUrl);
        
        if (favResponse.ok) {
          const arrayBuffer = await favResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64Data = buffer.toString('base64');
          const mimeType = getMimeType(remoteFaviconUrl);
          
          base64Favicon = `data:${mimeType};base64,${base64Data}`;
        } else {
          throw new Error(`HTTP status ${favResponse.status}`);
        }
      } catch (favError) {
        console.warn(`Could not process favicon for ${urlObj.hostname}:`, favError.message);
        base64Favicon = ""; 
      }

      currentSection.items.push({
        url: item,
        title,
        description,
        favicon: base64Favicon
      });

    } catch (error) {
      console.error(`Failed to fetch ${item}:`, error.message);
      currentSection.items.push({
        url: item,
        title: "Error loading site",
        description: error.message,
        favicon: ""
      });
    }
  }

  data.push(currentSection);
}

// --- HTML Mapping Section ---

const htmlOutput = data.map(section => {
  return /*html*/ `
<section>
  <h2>${section.name}</h2>${section.items.map(item => {
    return /*html*/ `
  <a class="link" tabindex="0" href="${ item.url }" target="_blank">
    ${item.favicon ? `<img src="${item.favicon}" alt="${item.title} icon" />` : ''}
    <div class="details">
      <span class="name">${item.title}</span>
      <span class="description">${item.description}</span>
    </div>
    <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
  </a>`;
  }).join('')}
</section>
  `;
}).join('');

console.log(htmlOutput);