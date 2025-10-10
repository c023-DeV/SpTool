
export class ShareMe {
  /**
   * @param {string} selector   CSS selector for the container (e.g. '#shareMe')
   * @param {string} [url]      Initial share URL (defaults to location.href)
   * @param {string} [joinwa]   WhatsApp link; if omitted the button is hidden
   */
  constructor(selector, url = location.href, joinwa) {

    this.host = document.querySelector(selector);
    if (!this.host) {
      throw new Error(`ShareMe: cannot find element "${selector}"`);
    }

    this.host.innerHTML = `
      <button id="joinWaBtn" class="wa-btn" aria-label="Join WhatsApp Group">
        📞 Join WhatsApp Group 🗯
      </button>

      <div class="share-wrap">
        <button id="shareBtn" class="share-btn" aria-label="Share">
          💖 Share 💖
        </button>

        <div class="share-link-wrap">
          <input id="shareUrl" class="sb-url" readonly aria-label="Share URL" />
          <button id="copyLinkBtn" class="sb-copy" type="button">Copy</button>
        </div>
      </div>
    `;

    this.$joinWaBtn = this.host.querySelector('.wa-btn');
    this.$shareBtn  = this.host.querySelector('.share-btn');
    this.$urlInput  = this.host.querySelector('.sb-url');
    this.$copyBtn   = this.host.querySelector('.sb-copy');

    this.$urlInput.value = url;
    this.$joinWaBtn.style.display = joinwa ? '' : 'none';
    if (joinwa) this.joinWaLink = joinwa;

    this._handleShare   = this._handleShare.bind(this);
    this._copyUrl       = this._copyUrl.bind(this);
    this._openWhatsApp  = this._openWhatsApp.bind(this);

    this.$shareBtn.addEventListener('click', this._handleShare);
    this.$copyBtn.addEventListener('click', this._copyUrl);
    this.$joinWaBtn.addEventListener('click', this._openWhatsApp);
  }


  async _handleShare(e) {
    e.preventDefault();

    if (navigator.share) {
        try {
        await navigator.share({
            title: document.title,
            text: document.title,
            url: this.$urlInput.value,
        });
        return;                    
        } catch (_) {
        // share failed (user cancelled or error); fall back to copy
        }
    }

    // ----- fallback: copy URL to clipboard -----
    await navigator.clipboard.writeText(this.$urlInput.value);
    const orig = this.$copyBtn.textContent;
    this.$copyBtn.textContent = 'Copied';
    clearTimeout(this._msgTimer);
    this._msgTimer = setTimeout(() => (this.$copyBtn.textContent = orig), 1500);
    }

  async _copyUrl(e) {
    e.preventDefault();
    await navigator.clipboard.writeText(this.$urlInput.value);
    const orig = this.$copyBtn.textContent;
    this.$copyBtn.textContent = 'Copied';
    clearTimeout(this._msgTimer);
    this._msgTimer = setTimeout(() => (this.$copyBtn.textContent = orig), 1500);
  }

  _openWhatsApp(e) {
    e.preventDefault();
    if (this.joinWaLink) window.open(this.joinWaLink, '_blank', 'noopener');
  }
}