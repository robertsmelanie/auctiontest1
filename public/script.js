  //  !--marked.js for Markdown rendering-- >
      
//   <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js" crossorigin="anonymous"></script>
    // <script src="script.js" type="module"></script>
      
// import marked from 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
// import marked from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';


    // const $ = (id) => document.getElementById(id);
    // const fileEl = $('file');
    // const thumb = $('thumb');
    // const descEl = $('desc');
    // const goBtn = $('go');
    // const spin = goBtn.querySelector('.spinner');
    // const out = $('out');
    // const errEl = $('error');
    // const statusEl = $('status');
    // const copyBtn = $('copy');
    // const filesize = $('filesize');

    // let fileBlob = null;

    // fileEl.addEventListener('change', () => {
    //   const f = fileEl.files?.[0];
    //   fileBlob = f || null;
    //   errEl.textContent = '';
    //   if (!f) { thumb.textContent = 'No image yet'; filesize.textContent = ''; return; }
    //   const url = URL.createObjectURL(f);
    //   thumb.innerHTML = '';
    //   const img = new Image();
    //   img.onload = () => URL.revokeObjectURL(url);
    //   img.src = url;
    //   img.style.maxHeight = '340px';
    //   img.style.width = '100%';
    //   img.style.objectFit = 'contain';
    //   thumb.appendChild(img);
    //   filesize.textContent = (f.size/1024/1024).toFixed(2) + ' MB';
    // });

    // copyBtn.addEventListener('click', async () => {
    //   const raw = out.getAttribute('data-raw') || out.textContent;
    //   try { await navigator.clipboard.writeText(raw); statusEl.textContent = 'Copied!'; setTimeout(()=>statusEl.textContent='',1200); }
    //   catch { statusEl.textContent = 'Copy failed'; }
    // });
// test add per examples
// async function generateListing(file, description) {
//     const form = new FormData();
//     if (file) form.append('image', file, file.name);
//     if (description) form.append('description', description);

//     const res = await fetch('/generate', { method: 'POST', body: form });
//     const data = await res.json();
//     if (!res.ok) throw new Error(data.error || 'Generation failed');
//     return data.markdown;
// }


// original code
//     async function generate() {
//       errEl.textContent = '';
//       out.textContent = '';
//       out.setAttribute('data-raw', '');

//       if (!fileBlob && !descEl.value.trim()) {
//         errEl.textContent = 'Please add an image or type a description.';
//         return;
//       }

//       goBtn.disabled = true; spin.style.display = 'inline-block'; statusEl.textContent = 'Working...';

//       try {
//         const form = new FormData();
//         if (fileBlob) form.append('image', fileBlob, fileBlob.name);
//         form.append('description', (descEl.value || '') .trim());

//         const res = await fetch('/generate', { method: 'POST', body: form }); // no manual Content-Type!
          
          
//         const res = await fetch('http://localhost:8787/generate', {
//           method: 'POST',
//           body: form
//         });
//         const json = await res.json();
//         if (!res.ok) throw new Error(json.error || 'Generation failed');

//         const md = json.markdown || '';
//         out.setAttribute('data-raw', md);
//         out.innerHTML = marked.parse(md);
//         statusEl.textContent = 'Done';
//       } catch (e) {
//         errEl.textContent = e.message || String(e);
//         statusEl.textContent = 'Error';
//       } finally {
//         goBtn.disabled = false; spin.style.display = 'none';
//         setTimeout(()=> (statusEl.textContent=''), 1200);
//       }
//     }

// goBtn.addEventListener('click', generate);
    
// out.innerHTML = marked.parse(md); 

const $ = (id) => document.getElementById(id);
const fileEl = $('file');
const thumb = $('thumb');
const descEl = $('desc');
const goBtn = $('go');
const spin = goBtn.querySelector('.spinner');
const out = $('out');
const errEl = $('error');
const statusEl = $('status');
const copyBtn = $('copy');
const filesize = $('filesize');

let fileBlob = null;

fileEl.addEventListener('change', () => {
    const f = fileEl.files?.[0];
    fileBlob = f || null;
    errEl.textContent = '';
    if (!f) { thumb.textContent = 'No image yet'; filesize.textContent = ''; return; }
    const url = URL.createObjectURL(f);
    thumb.innerHTML = '';
    const img = new Image();
    img.onload = () => URL.revokeObjectURL(url);
    img.src = url;
    img.style.maxHeight = '340px';
    img.style.width = '100%';
    img.style.objectFit = 'contain';
    thumb.appendChild(img);
    filesize.textContent = (f.size / 1024 / 1024).toFixed(2) + ' MB';
});

copyBtn.addEventListener('click', async () => {
    const raw = out.getAttribute('data-raw') || out.textContent;
    try {
        await navigator.clipboard.writeText(raw);
        statusEl.textContent = 'Copied!';
    } catch {
        statusEl.textContent = 'Copy failed';
    } finally {
        setTimeout(() => (statusEl.textContent = ''), 1200);
    }
});

// OPTIONAL: remove this helper to avoid confusion; keeping generate() only
// async function generateListing(file, description) { ... }

async function generate() {
    errEl.textContent = '';
    out.textContent = '';
    out.setAttribute('data-raw', '');

    const desc = (descEl.value || '').trim();
    if (!fileBlob && !desc) {
        errEl.textContent = 'Please add an image or type a description.';
        return;
    }

    goBtn.disabled = true;
    spin.style.display = 'inline-block';
    statusEl.textContent = 'Working...';

    try {
        const form = new FormData();
        if (fileBlob) form.append('image', fileBlob, fileBlob.name); // key MUST be "image"
        if (desc) form.append('description', desc);

        // ✅ keep ONE fetch, use same-origin path (server serves /public)
        const res = await fetch('/generate', { method: 'POST', body: form });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

        const md = json.markdown || '';
        out.setAttribute('data-raw', md);

        // Marked must be loaded before this script, or imported as a module
        out.innerHTML = marked.parse(md); // or DOMPurify.sanitize(marked.parse(md)) if you included DOMPurify

        statusEl.textContent = 'Done';
    } catch (e) {
        errEl.textContent = e.message || String(e);
        statusEl.textContent = 'Error';
        console.error(e);
    } finally {
        goBtn.disabled = false;
        spin.style.display = 'none';
        setTimeout(() => (statusEl.textContent = ''), 1200);
    }
}

goBtn.addEventListener('click', generate);
