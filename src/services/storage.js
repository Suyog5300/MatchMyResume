
export const StorageService = {
    async getApiKey() {
      const result = await chrome.storage.local.get(['geminiApiKey']);
      return result.geminiApiKey;
    },
  
    async setApiKey(apiKey) {
      await chrome.storage.local.set({ geminiApiKey: apiKey });
    },
  
    async hasApiKey() {
      const apiKey = await this.getApiKey();
      return !!apiKey;
    }
  };